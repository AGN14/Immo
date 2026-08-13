import Link from "next/link";
import {
  getBienById,
  getLocataireById,
  getPaiementsPeriodeCourante,
  PERIODE_COURANTE,
} from "@/lib/mock-data";
import { methodeLabel, statutPaiementLabel } from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";

export default function LoyersPage() {
  const paiements = getPaiementsPeriodeCourante();
  const total = paiements.reduce((sum, p) => sum + p.montantFcfa, 0);
  const recu = paiements
    .filter((p) => p.statut === "recu")
    .reduce((sum, p) => sum + p.montantFcfa, 0);

  return (
    <div>
      <h1 className="font-display text-ink text-[1.9rem] font-bold">Loyers</h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">
        Suivi des loyers pour la période {PERIODE_COURANTE} —{" "}
        <span className="font-mono">
          {recu.toLocaleString("fr-FR")} / {total.toLocaleString("fr-FR")} F
        </span>{" "}
        encaissés.
      </p>

      <div className="border-line bg-surface mt-6 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-line border-b">
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Bien
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Locataire
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Montant
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Moyen
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => {
              const bien = getBienById(p.bienId);
              const locataire = getLocataireById(p.locataireId);
              const statut = statutPaiementLabel[p.statut];
              return (
                <tr key={p.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    {bien ? (
                      <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
                        {bien.nom}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{locataire?.nom ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{p.montantFcfa.toLocaleString("fr-FR")} F</td>
                  <td className="px-4 py-3">{methodeLabel[p.methode]}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
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
