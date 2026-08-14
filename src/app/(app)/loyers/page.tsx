import Link from "next/link";
import {
  getBailById,
  getBienById,
  getLocataireById,
  getLotById,
  getPaiementsPeriodeCourante,
  getQuittanceDuPaiement,
  periodeCourante,
  versementDuPaiement,
} from "@/lib/mock-data";
import { methodeLabel, statutVersementLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

export default async function LoyersPage() {
  const { proprietaireId } = await requireProprietaire();

  const periode = periodeCourante();
  const paiements = getPaiementsPeriodeCourante(proprietaireId);
  const total = paiements.reduce((sum, p) => sum + p.montantFcfa, 0);
  const encaisse = paiements
    .filter((p) => versementDuPaiement(p.versementId)?.statut === "confirme")
    .reduce((sum, p) => sum + p.montantFcfa, 0);

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Loyers</h1>
      <p className="text-ink-2 mt-2">
        Période {periode} —{" "}
        <span className="text-primary font-semibold" data-numeric>
          {encaisse.toLocaleString("fr-FR")} / {total.toLocaleString("fr-FR")} F
        </span>{" "}
        confirmés.
      </p>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Logement</th>
              <th className={th}>Locataire</th>
              <th className={th}>Montant</th>
              <th className={th}>Moyen</th>
              <th className={th}>Versement</th>
              <th className={th}>Quittance</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => {
              const bail = getBailById(proprietaireId, p.bailId);
              const lot = bail ? getLotById(proprietaireId, bail.lotId) : undefined;
              const bien = lot ? getBienById(proprietaireId, lot.bienId) : undefined;
              const locataire = bail
                ? getLocataireById(proprietaireId, bail.locataireId)
                : undefined;
              const versement = versementDuPaiement(p.versementId);
              const statut = versement ? statutVersementLabel[versement.statut] : undefined;
              const quittance = getQuittanceDuPaiement(p.id);

              return (
                <tr key={p.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    {bien && lot ? (
                      <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
                        {bien.nom} — {lot.nom}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-ink-2 px-4 py-3">{locataire?.nom ?? "—"}</td>
                  <td className="text-primary px-4 py-3 font-semibold">
                    {p.montantFcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-ink-2 px-4 py-3">
                    {versement ? methodeLabel[versement.methode] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {statut && <StatusPill tone={statut.tone}>{statut.label}</StatusPill>}
                  </td>
                  <td className="text-ink-2 px-4 py-3" data-numeric>
                    {quittance ? quittance.numero : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-ink-3 mt-4 text-sm">
        Un mois sans ligne n&rsquo;a pas été payé : son retard se déduit de la date
        d&rsquo;échéance, rien n&rsquo;est stocké.
      </p>
    </div>
  );
}
