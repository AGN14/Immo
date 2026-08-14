"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/mock-session";
import { requireProprietaire } from "@/lib/auth/mock-session";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { moisAPayer, penaliteDuMois } from "@/lib/echeances";
import { supabaseServer } from "@/lib/supabase/server";
import type { EtatAction } from "@/lib/actions/biens";
import type { MethodePaiement } from "@/lib/types";

const methodes = [
  "mobile-money",
  "virement",
  "especes",
] as const satisfies readonly MethodePaiement[];

/**
 * Confirmer un versement = le considérer encaissé ET émettre les quittances de
 * chacun de ses mois. Les deux vont ensemble : sans confirmation, pas de
 * quittance ; avec confirmation, la dette du locataire est éteinte.
 */
export async function confirmerVersement(
  versementId: string,
  _prev: EtatAction,
  _formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const { data: versement } = await supabaseServer()
    .from("versement")
    .select("id, statut, bail_id")
    .eq("id", versementId)
    .maybeSingle();
  if (!versement) return { ok: false, erreur: "Versement introuvable." };
  if (versement.statut !== "initie")
    return { ok: false, erreur: "Ce versement n'attend plus de confirmation." };

  // Le versement doit appartenir au parc demandeur : bail → lot → bien.
  const { data: bail } = await supabaseServer()
    .from("bail")
    .select("lot_id")
    .eq("id", versement.bail_id)
    .maybeSingle();
  if (!bail) return { ok: false, erreur: "Bail introuvable." };
  const { data: lot } = await supabaseServer()
    .from("lot")
    .select("bien_id")
    .eq("id", bail.lot_id)
    .maybeSingle();
  if (!lot) return { ok: false, erreur: "Logement introuvable." };
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", lot.bien_id)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Ce versement n'appartient pas à votre parc." };

  const { data: paiements } = await supabaseServer()
    .from("paiement")
    .select("id")
    .eq("versement_id", versementId);

  if (paiements && paiements.length > 0) {
    // Numérotation continue et sans trou, défendue par le verrou en base.
    for (const paiement of paiements) {
      const { data: numero, error: erreurNumero } = await supabaseServer().rpc(
        "prochain_numero_quittance",
        { p_proprietaire_id: proprietaireId },
      );
      if (erreurNumero || !numero)
        return { ok: false, erreur: "Émission de la quittance impossible." };

      const { error } = await supabaseServer().from("quittance").insert({
        paiement_id: paiement.id,
        proprietaire_id: proprietaireId,
        numero,
      });
      if (error)
        return { ok: false, erreur: `Émission de la quittance impossible : ${error.message}` };
    }
  }

  const { error } = await supabaseServer()
    .from("versement")
    .update({
      statut: "confirme",
      confirme_le: new Date().toISOString(),
      confirme_par: "proprietaire",
    })
    .eq("id", versementId);

  if (error) return { ok: false, erreur: `Confirmation impossible : ${error.message}` };

  revalidatePath("/loyers");
  revalidatePath("/dashboard");
  revalidatePath("/locataires");
  revalidatePath("/biens");
  return { ok: true };
}

/**
 * La déclaration du locataire : un versement « initié » + une ligne de paiement
 * par mois couvert. Le propriétaire confirmera ensuite — ou pas.
 */
export async function declarerVersement(prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const session = await getSession();
  if (!session || session.role !== "locataire" || !session.locataireId)
    return { ok: false, erreur: "Connexion locataire requise." };

  // Le propriétaire est nécessaire ici : c'est lui qui porte le barème de
  // l'amende et le jour d'échéance qui la déclenche.
  const logement = await getLogementDuLocataire(session.locataireId);
  if (!logement?.bail || !logement.proprietaire)
    return { ok: false, erreur: "Aucun bail en cours sur votre compte." };
  const { bail, proprietaire } = logement;

  const mois = formData.getAll("mois").map(String).sort();
  const montant = Number(formData.get("montantFcfa") ?? "NaN");
  const methode = String(formData.get("methode") ?? "");
  const reference = String(formData.get("referenceExterne") ?? "").trim() || null;

  if (mois.length === 0) return { ok: false, erreur: "Choisissez au moins un mois." };
  if (mois.some((m) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(m)))
    return { ok: false, erreur: "Période invalide." };
  if (!Number.isInteger(montant) || montant <= 0)
    return { ok: false, erreur: "Le montant doit être positif." };
  if (!methodes.some((m) => m === methode))
    return { ok: false, erreur: "Moyen de paiement invalide." };

  // L'amende est figée maintenant, mois par mois. La recalculer à la
  // confirmation ferait grossir la note pendant que le propriétaire vérifie :
  // le locataire doit ce qu'il devait le jour où il a payé.
  const penalites = mois.map((periode) => penaliteDuMois(periode, bail, proprietaire));
  const penalitesFcfa = penalites.reduce((somme, montantDu) => somme + montantDu, 0);
  const loyersFcfa = mois.length * bail.loyerMensuelFcfa;

  // Un mois = un loyer + son éventuelle amende, ni plus ni moins : on ne laisse
  // pas s'insinuer un montant fantaisiste entre le locataire et sa quittance.
  if (montant !== loyersFcfa + penalitesFcfa) {
    const attendu = loyersFcfa + penalitesFcfa;
    const detail =
      penalitesFcfa > 0
        ? ` (${mois.length} mois × ${bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F + ${penalitesFcfa.toLocaleString("fr-FR")} F d'amende de retard)`
        : ` (${mois.length} mois × ${bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F)`;
    return {
      ok: false,
      erreur: `Ce montant correspond à ${attendu.toLocaleString("fr-FR")} F${detail}.`,
    };
  }

  // Sécurité de bon sens : on ne déclare que des mois réellement dus.
  const [paiements, versements] = await Promise.all([
    getPaiementsDuLocataire(session.locataireId),
    getVersementsDuLocataire(session.locataireId),
  ]);
  const aPayer = new Set(moisAPayer(bail, paiements, versements, mois.length));
  if (mois.some((m) => !aPayer.has(m)))
    return { ok: false, erreur: "Certains mois ne sont pas dus sur votre bail." };

  const { data: versement, error } = await supabaseServer()
    .from("versement")
    .insert({
      bail_id: bail.id,
      montant_total_fcfa: montant,
      penalites_fcfa: penalitesFcfa,
      methode,
      reference_externe: reference,
      statut: "initie",
    })
    .select("id")
    .single();

  if (error || !versement) {
    return { ok: false, erreur: `Déclaration impossible : ${error?.message ?? "inconnue"}` };
  }

  const { error: erreurPaiements } = await supabaseServer()
    .from("paiement")
    .insert(
      mois.map((periode, i) => ({
        bail_id: bail.id,
        versement_id: versement.id,
        periode,
        montant_fcfa: bail.loyerMensuelFcfa,
        penalite_fcfa: penalites[i],
      })),
    );

  if (erreurPaiements) {
    // Un paiement par mois et par bail : la contrainte refuse les doublons.
    return {
      ok: false,
      erreur: erreurPaiements.message.includes("paiement_bail_periode")
        ? "Ce mois est déjà couvert par une déclaration."
        : `Déclaration impossible : ${erreurPaiements.message}`,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/payer");
  return { ok: true };
}
