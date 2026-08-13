import Link from "next/link";
import { getBienById, locataires } from "@/lib/mock-data";
import { statutLoyerLabel } from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";

export default function LocatairesPage() {
  return (
    <div>
      <h1 className="font-display text-ink text-[1.9rem] font-bold">Locataires</h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">
        {locataires.length} locataires actifs dans votre parc.
      </p>

      <div className="border-line bg-surface mt-6 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-line border-b">
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Locataire
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Bien
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Téléphone
              </th>
              <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Loyer
              </th>
            </tr>
          </thead>
          <tbody>
            {locataires.map((l) => {
              const bien = getBienById(l.bienId);
              const statut = statutLoyerLabel[l.statutLoyer];
              return (
                <tr key={l.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary grid size-8 shrink-0 place-items-center rounded-full font-mono text-[0.68rem] font-semibold text-white">
                        {l.nom
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </span>
                      <div>
                        <div className="text-ink font-semibold">{l.nom}</div>
                        <div className="text-ink-3 text-[0.76rem]">{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {bien ? (
                      <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
                        {bien.nom}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{l.telephone}</td>
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
