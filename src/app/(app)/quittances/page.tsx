import { requireLocataire } from "@/lib/auth/session";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getQuittancesDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { methodeLabel } from "@/lib/status-labels";

export const metadata = { title: "Mes quittances" };

const moisFr = (periode: string) =>
  new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Les quittances du locataire, année par année.
 *
 * Elles vivaient au bas du tableau de bord, mêlées à l'historique des
 * paiements. Or ce n'est pas un historique qu'on vient chercher ici : c'est un
 * document précis, souvent des mois après, pour un dossier de logement ou un
 * justificatif de domicile. Il lui fallait sa propre page.
 *
 * Le regroupement par année n'est pas décoratif : une demande porte presque
 * toujours sur « les douze derniers mois » ou sur une année civile.
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

  // Une quittance sans son paiement n'a rien à dire : on ne l'affiche pas.
  const lignes = quittances
    .map((q) => ({ quittance: q, paiement: paiementParId.get(q.paiementId) }))
    .filter((l): l is { quittance: (typeof quittances)[0]; paiement: (typeof paiements)[0] } =>
      Boolean(l.paiement),
    )
    .sort((a, b) => b.paiement.periode.localeCompare(a.paiement.periode));

  const annees = [...new Set(lignes.map((l) => l.paiement.periode.slice(0, 4)))].sort((a, b) =>
    b.localeCompare(a),
  );

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
        annees.map((annee) => {
          const deLAnnee = lignes.filter((l) => l.paiement.periode.startsWith(annee));
          const total = deLAnnee.reduce(
            (s, l) => s + l.paiement.montantFcfa + l.paiement.penaliteFcfa,
            0,
          );

          return (
            <section key={annee} className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-ink text-2xl font-semibold">{annee}</h2>
                <p className="text-ink-2 text-sm">
                  {deLAnnee.length} quittance{deLAnnee.length > 1 && "s"} ·{" "}
                  <span className="text-ink font-semibold" data-numeric>
                    {total.toLocaleString("fr-FR")} F
                  </span>
                </p>
              </div>

              <ul className="mt-4 flex flex-col gap-3">
                {deLAnnee.map(({ quittance, paiement }) => {
                  const versement = versementParId.get(paiement.versementId);
                  const total = paiement.montantFcfa + paiement.penaliteFcfa;

                  return (
                    <li
                      key={quittance.id}
                      className="border-line bg-surface flex flex-wrap items-center justify-between gap-4 rounded-md border p-4"
                    >
                      <div>
                        <p className="text-ink font-semibold">
                          Loyer de {moisFr(paiement.periode)}
                        </p>
                        <p className="text-ink-3 mt-1 text-sm">
                          N° <span data-numeric>{quittance.numero}</span> · émise le{" "}
                          {dateFr(quittance.emiseLe)}
                          {versement && ` · ${methodeLabel[versement.methode]}`}
                        </p>
                        {/* L'amende est dite ici aussi : elle explique un montant
                            qui dépasse le loyer, et évite de croire à une erreur. */}
                        {paiement.penaliteFcfa > 0 && (
                          <p className="text-ink-3 mt-1 text-sm">
                            {paiement.montantFcfa.toLocaleString("fr-FR")} F de loyer
                            <span className="text-danger font-semibold">
                              {" "}
                              + {paiement.penaliteFcfa.toLocaleString("fr-FR")} F d&rsquo;amende
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className="font-display text-primary text-xl font-semibold"
                          data-numeric
                        >
                          {total.toLocaleString("fr-FR")} F
                        </span>
                        <a
                          href={`/quittances/${quittance.id}`}
                          target="_blank"
                          rel="noopener"
                          className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2 text-sm font-semibold no-underline transition-colors"
                        >
                          Télécharger
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {logement?.proprietaire && (
        <p className="border-line bg-surface text-ink-2 mt-10 rounded-md border p-4 text-sm">
          Une quittance manquante ou erronée ? Signalez-le à{" "}
          <strong className="text-ink font-semibold">{logement.proprietaire.nom}</strong> : lui seul
          peut la rectifier, une quittance émise ne se modifie pas.
        </p>
      )}
    </div>
  );
}
