import { refuserVersement, validerVersement } from "@/lib/actions/proprietaire";
import {
  getBailById,
  getBienById,
  getLocataireById,
  getLotById,
  getPaiements,
  getQuittanceDuPaiement,
  getVersements,
} from "@/lib/mock-data";
import { methodeLabel, statutVersementLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function VersementsPage() {
  const { proprietaireId } = await requireProprietaire();

  const versements = getVersements(proprietaireId);
  const paiements = getPaiements(proprietaireId);
  const aConfirmer = versements.filter((v) => v.statut === "initie");
  const traites = versements.filter((v) => v.statut !== "initie");

  const contexte = (bailId: string) => {
    const bail = getBailById(proprietaireId, bailId);
    const lot = bail ? getLotById(proprietaireId, bail.lotId) : undefined;
    const bien = lot ? getBienById(proprietaireId, lot.bienId) : undefined;
    const locataire = bail ? getLocataireById(proprietaireId, bail.locataireId) : undefined;
    return { lot, bien, locataire };
  };

  const moisCouverts = (versementId: string) =>
    paiements
      .filter((p) => p.versementId === versementId)
      .map((p) => p.periode)
      .sort();

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Versements</h1>
      <p className="text-ink-2 mt-2">
        Vos locataires déclarent leur paiement, vous le pointez sur votre relevé. La quittance part
        dès votre confirmation.
      </p>

      <h2 className="font-display text-ink mt-10 text-2xl font-semibold">
        À confirmer{aConfirmer.length > 0 && ` (${aConfirmer.length})`}
      </h2>

      {aConfirmer.length === 0 ? (
        <p className="text-ink-3 mt-3 text-sm">Aucune déclaration en attente.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {aConfirmer.map((v) => {
            const { lot, bien, locataire } = contexte(v.bailId);
            const mois = moisCouverts(v.id);
            return (
              <li key={v.id} className="border-primary bg-highlight rounded-md border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-ink font-semibold">
                      {locataire?.nom ?? "—"} — {bien?.nom} {lot?.nom}
                    </p>
                    <p className="text-ink-2 mt-1 text-sm">
                      {mois.length} mois : {mois.join(", ")} · {methodeLabel[v.methode]}
                      {v.referenceExterne && (
                        <>
                          {" · réf. "}
                          <span className="text-ink font-semibold" data-numeric>
                            {v.referenceExterne}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-ink-3 mt-1 text-sm">Déclaré le {v.declareLe}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-primary text-2xl font-semibold" data-numeric>
                      {v.montantTotalFcfa.toLocaleString("fr-FR")} F
                    </p>
                    {/* Le propriétaire doit savoir que la somme annoncée dépasse
                        les loyers, sinon le pointage sur son relevé échoue. */}
                    {v.penalitesFcfa && v.penalitesFcfa > 0 ? (
                      <p className="text-ink-3 mt-1 text-sm" data-numeric>
                        dont{" "}
                        <span className="text-danger font-semibold">
                          {v.penalitesFcfa.toLocaleString("fr-FR")} F
                        </span>{" "}
                        d&rsquo;amende
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="border-line-soft mt-4 flex flex-wrap gap-3 border-t pt-4">
                  <form action={validerVersement}>
                    <input type="hidden" name="versementId" value={v.id} />
                    <button
                      type="submit"
                      className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      J&rsquo;ai bien reçu {v.montantTotalFcfa.toLocaleString("fr-FR")} F
                    </button>
                  </form>
                  <form action={refuserVersement}>
                    <input type="hidden" name="versementId" value={v.id} />
                    <button
                      type="submit"
                      className="border-line text-ink-2 hover:border-danger hover:text-danger rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Introuvable sur mon relevé
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="font-display text-ink mt-12 text-2xl font-semibold">Historique</h2>

      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className="text-ink-2 px-4 py-3 font-medium">Locataire</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Mois</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Montant</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Moyen</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Statut</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Quittances</th>
            </tr>
          </thead>
          <tbody>
            {traites.slice(0, 20).map((v) => {
              const { locataire } = contexte(v.bailId);
              const mois = moisCouverts(v.id);
              const statut = statutVersementLabel[v.statut];
              const numeros = paiements
                .filter((p) => p.versementId === v.id)
                .map((p) => getQuittanceDuPaiement(p.id)?.numero)
                .filter(Boolean);
              return (
                <tr key={v.id} className="border-line border-b last:border-0">
                  <td className="text-ink px-4 py-3 font-semibold">{locataire?.nom ?? "—"}</td>
                  <td className="text-ink-2 px-4 py-3">{mois.join(", ") || "—"}</td>
                  <td className="text-primary px-4 py-3 font-semibold">
                    {v.montantTotalFcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-ink-2 px-4 py-3">{methodeLabel[v.methode]}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
                  </td>
                  <td className="text-ink-2 px-4 py-3" data-numeric>
                    {numeros.join(", ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
