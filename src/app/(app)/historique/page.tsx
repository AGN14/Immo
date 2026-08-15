import Link from "next/link";
import { requireLocataire } from "@/lib/auth/session";
import { getPaiementsDuLocataire, getVersementsDuLocataire } from "@/lib/data";
import { methodeLabel, statutVersementLabel } from "@/lib/status-labels";
import { TableauHistorique, type LigneHistorique } from "@/app/(app)/historique/TableauHistorique";

export const metadata = { title: "Historique des paiements" };

/**
 * L'historique des paiements du locataire.
 *
 * Il vivait au bas du tableau de bord, où l'on venait pourtant pour savoir ce
 * qu'on doit maintenant, pas ce qu'on a payé en mars. Deux questions
 * différentes : la première appelle un chiffre, la seconde un tableau qu'on
 * fouille.
 *
 * La colonne « Quittance » n'a pas été reprise — elle a sa propre page. Reste
 * le statut, que l'autre page ne peut pas montrer : une quittance n'existe
 * qu'après confirmation.
 */
export default async function HistoriquePage() {
  const { locataireId } = await requireLocataire();

  const [paiements, versements] = await Promise.all([
    getPaiementsDuLocataire(locataireId),
    getVersementsDuLocataire(locataireId),
  ]);

  const versementParId = new Map(versements.map((v) => [v.id, v]));

  const lignes: LigneHistorique[] = paiements
    .flatMap((p) => {
      const v = versementParId.get(p.versementId);
      // Un paiement sans versement est un état impossible : plutôt que
      // d'inventer un statut, on n'affiche pas la ligne.
      if (!v) return [];
      const s = statutVersementLabel[v.statut];
      return [
        {
          id: p.id,
          periode: p.periode,
          loyerFcfa: p.montantFcfa,
          penaliteFcfa: p.penaliteFcfa,
          methode: methodeLabel[v.methode] ?? v.methode,
          statut: v.statut,
          statutLabel: s.label,
          statutTone: s.tone,
          date: v.confirmeLe ?? v.declareLe,
          enAttente: v.statut === "initie",
        },
      ];
    })
    .sort((a, b) => b.periode.localeCompare(a.periode));

  const attente = lignes.filter((l) => l.enAttente).length;

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Historique des paiements</h1>
      <p className="text-ink-2 mt-2">
        Tous vos règlements, confirmés ou non. Pour télécharger un justificatif, rendez-vous dans{" "}
        <Link
          href="/quittances"
          className="text-primary font-semibold underline-offset-2 hover:underline"
        >
          Mes quittances
        </Link>
        .
      </p>

      {/* Une déclaration en attente est la seule chose qui demande une suite :
          elle mérite d'être dite avant le tableau, pas cherchée dedans. */}
      {attente > 0 && (
        <p className="border-line bg-sand text-ink-2 mt-6 rounded-md border p-4 text-sm">
          <strong className="text-ink font-semibold">
            {attente} paiement{attente > 1 ? "s" : ""} en attente de confirmation
          </strong>{" "}
          par votre propriétaire. La quittance sera émise dès qu&rsquo;il aura confirmé avoir reçu la
          somme.
        </p>
      )}

      {lignes.length === 0 ? (
        <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-ink-3 text-sm">
            Aucun paiement pour l&rsquo;instant. Votre premier règlement apparaîtra ici.
          </p>
        </div>
      ) : (
        <TableauHistorique lignes={lignes} />
      )}
    </div>
  );
}
