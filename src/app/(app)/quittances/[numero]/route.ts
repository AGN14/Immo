import { getSession } from "@/lib/auth/session";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { montantEnLettres } from "@/lib/montant-en-lettres";
import { methodeLabel } from "@/lib/status-labels";
import { buildQuittance } from "@/lib/quittance-pdf";

/** fontkit ne fonctionne pas sur le runtime edge : la police est lue au disque. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const moisFr = (periode: string) =>
  new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Reconnaît un ancien lien : un numéro de quittance ne ressemble pas à ça. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Première lettre en capitale — « juillet 2026 » devient « Juillet 2026 ». */
const capitale = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * La quittance d'un paiement, en PDF.
 *
 * Toutes les données viennent de la BASE, jamais du client. Une route qui
 * accepterait un corps JSON laisserait n'importe qui fabriquer une quittance à
 * son nom, avec le montant et le bailleur de son choix — un faux document
 * parfaitement crédible.
 *
 * L'accès ne repose pas non plus sur une comparaison d'identifiants : la
 * requête part avec le jeton de l'utilisateur, et les politiques RLS ne
 * laissent passer que les quittances de son parc ou de ses baux. Un identifiant
 * deviné ne renvoie rien.
 */
export async function GET(_request: Request, contexte: { params: Promise<{ numero: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Connexion requise.", { status: 401 });

  const { numero } = await contexte.params;
  const sb = supabaseUtilisateur();

  const colonnes = "id, numero, emise_le, annulee_le, paiement_id, proprietaire_id";

  /**
   * Le numéro suffit à désigner la quittance, et c'est celui que le locataire a
   * sous les yeux sur son papier. En base il n'est unique que par propriétaire
   * — mais sous RLS cela ne laisse aucune ambiguïté : un propriétaire ne voit
   * que ses propres quittances, et un locataire n'a qu'un seul bailleur
   * (`locataire.proprietaire_id` est une colonne unique). Dans les deux cas la
   * requête ne peut ramener qu'une ligne.
   */
  const { data: quittance } = await sb
    .from("quittance")
    .select(colonnes)
    .eq("numero", numero)
    .maybeSingle();

  // Les anciens liens portaient l'UUID. On les honore, puis on renvoie vers
  // l'adresse en numéro pour qu'ils cessent de circuler.
  if (!quittance && UUID.test(numero)) {
    const { data } = await sb.from("quittance").select(colonnes).eq("id", numero).maybeSingle();
    if (data) {
      return Response.redirect(new URL(`/quittances/${data.numero}`, _request.url), 308);
    }
  }

  if (!quittance) return new Response("Quittance introuvable.", { status: 404 });

  const { data: paiement } = await sb
    .from("paiement")
    .select("periode, montant_fcfa, penalite_fcfa, bail_id, versement_id")
    .eq("id", quittance.paiement_id)
    .maybeSingle();
  if (!paiement) return new Response("Paiement introuvable.", { status: 404 });

  const [{ data: bail }, { data: versement }, { data: reglages }] = await Promise.all([
    sb.from("bail").select("lot_id, locataire_id").eq("id", paiement.bail_id).maybeSingle(),
    sb.from("versement").select("methode").eq("id", paiement.versement_id).maybeSingle(),
    sb
      .from("proprietaire_reglages")
      .select("nom")
      .eq("id", quittance.proprietaire_id)
      .maybeSingle(),
  ]);

  const { data: lot } = bail
    ? await sb.from("lot").select("nom, bien_id").eq("id", bail.lot_id).maybeSingle()
    : { data: null };
  const { data: bien } = lot
    ? await sb
        .from("bien")
        .select("nom, adresse, quartier, ville")
        .eq("id", lot.bien_id)
        .maybeSingle()
    : { data: null };
  const { data: locataire } = bail
    ? await sb.from("locataire").select("nom, telephone").eq("id", bail.locataire_id).maybeSingle()
    : { data: null };

  const total = paiement.montant_fcfa + paiement.penalite_fcfa;
  const bailleur = reglages?.nom ?? "";

  const pdf = await buildQuittance({
    // La marque édite le document ; le bailleur est celui qui donne quittance.
    marque: "XWEGAN",
    bailleur,
    sousTitre: "Gestion locative — quittance de loyer",
    // Le bailleur n'a pas de téléphone en base : l'en-tête s'en passe plutôt
    // que d'afficher un tiret. À renseigner le jour où la fiche le portera.
    telSociete: undefined,
    telLocataire: locataire?.telephone ?? "",
    numero: quittance.numero,
    montantChiffres: total.toLocaleString("fr-FR"),
    locataire: locataire?.nom ?? "",
    // Le montant en lettres fait foi contre celui en chiffres : c'est lui qui
    // empêche d'ajouter un zéro après coup.
    //
    // Sans « francs CFA » : le mot « Francs » est déjà ancré en fin de ligne,
    // comme sur le quittancier papier. L'écrire deux fois donnait « soixante
    // mille francs CFA ......... Francs ».
    sommeLettres: capitale(montantEnLettres(total)),
    periode: capitale(moisFr(paiement.periode)),
    residence: bien?.nom ?? "",
    chambre: lot?.nom ?? "",
    adresse: [bien?.adresse, bien?.quartier, bien?.ville].filter(Boolean).join(", "),
    moyenPaiement: versement ? (methodeLabel[versement.methode] ?? versement.methode) : "",
    date: dateFr(quittance.emise_le),
    signataire: bailleur,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quittance-${quittance.numero}.pdf"`,
      // Une quittance est nominative : elle ne doit jamais atterrir dans un
      // cache partagé.
      "Cache-Control": "private, no-store",
    },
  });
}
