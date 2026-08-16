import { requireLocataire } from "@/lib/auth/session";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getQuittancesDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { methodeLabel } from "@/lib/status-labels";
import {
  TableauQuittances,
  type LigneQuittance,
} from "@/app/(app)/quittances/TableauQuittances";

export const metadata = { title: "Mes quittances" };

/**
 * Les quittances du locataire.
 *
 * Elles vivaient au bas du tableau de bord, mêlées à l'historique des
 * paiements. Or ce n'est pas un historique qu'on vient chercher ici, mais un
 * document précis, souvent des mois après : dossier de logement, justificatif
 * de domicile, litige. D'où la page dédiée, et le tableau filtrable plutôt
 * qu'une liste — on cherche une ligne, on ne parcourt pas.
 */
export default async function QuittancesPage() {
  const { locataireId } = await requireLocataire();

  const [logement, quittances, paiements, versements] = await Promise.all([
    getLogementDuLocataire(locataireId),
    getQuittancesDuLocataire(locataireId),
    getPaiementsDuLocataire(locataireId),
    getVersementsDuLocataire(locataireId),
  ]);

  const paiementParId = new Map(paiements.map((p) => [p.id, p]));
  const versementParId = new Map(versements.map((v) => [v.id, v]));

  // Une quittance dont le paiement manque n'a rien à dire : on l'écarte.
  const lignes: LigneQuittance[] = quittances
    .flatMap((q) => {
      const p = paiementParId.get(q.paiementId);
      if (!p) return [];
      const v = versementParId.get(p.versementId);
      return [
        {
          id: q.id,
          numero: q.numero,
          emiseLe: q.emiseLe,
          periode: p.periode,
          loyerFcfa: p.montantFcfa,
          penaliteFcfa: p.penaliteFcfa,
          methode: v ? (methodeLabel[v.methode] ?? v.methode) : "—",
        },
      ];
    })
    .sort((a, b) => b.periode.localeCompare(a.periode));

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Mes quittances</h1>
      <p className="text-ink-2 mt-2">
        Chaque loyer confirmé donne lieu à une quittance numérotée. Elle vous sert de justificatif
        de domicile et de preuve de paiement — téléchargez-la autant de fois que nécessaire.
      </p>

      {lignes.length === 0 ? (
        <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-ink-3 text-sm">
            Aucune quittance pour l&rsquo;instant. La première sera émise dès qu&rsquo;un paiement
            sera confirmé.
          </p>
        </div>
      ) : (
        <TableauQuittances lignes={lignes} />
      )}

      {logement?.proprietaire && lignes.length > 0 && (
        <p className="border-line bg-surface text-ink-2 mt-8 rounded-md border p-4 text-sm">
          Une quittance manquante ou erronée ? Signalez-le à{" "}
          <strong className="text-ink font-semibold">{logement.proprietaire.nom}</strong> : lui seul
          peut la rectifier, une quittance émise ne se modifie pas.
        </p>
      )}
    </div>
  );
}
