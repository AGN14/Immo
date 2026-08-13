import Link from "next/link";
import { notFound } from "next/navigation";
import { getBienById, getLocataireByBienId, getPaiementsByBienId } from "@/lib/mock-data";
import { methodeLabel, statutOccupationLabel, statutPaiementLabel } from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";

const typeLabel = {
  appartement: "Appartement",
  villa: "Villa",
  studio: "Studio",
  immeuble: "Immeuble",
};

export default async function BienDetailPage(props: PageProps<"/biens/[id]">) {
  const { id } = await props.params;
  const bien = getBienById(id);
  if (!bien) notFound();

  const locataire = getLocataireByBienId(bien.id);
  const paiements = getPaiementsByBienId(bien.id);
  const occupation = statutOccupationLabel[bien.statutOccupation];

  return (
    <div>
      <Link href="/biens" className="text-ink-3 text-[0.82rem] no-underline">
        ← Tous les biens
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-[1.9rem] font-bold">{bien.nom}</h1>
          <p className="text-ink-2 mt-1 text-[0.95rem]">
            {bien.adresse}, {bien.quartier}, {bien.ville}
          </p>
        </div>
        <StatusPill tone={occupation.tone}>{occupation.label}</StatusPill>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-line bg-surface rounded-md border p-4">
          <div className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
            Type
          </div>
          <div className="text-ink mt-1 text-[0.95rem] font-semibold">{typeLabel[bien.type]}</div>
        </div>
        <div className="border-line bg-surface rounded-md border p-4">
          <div className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
            Loyer mensuel
          </div>
          <div className="text-ink mt-1 font-mono text-[0.95rem] font-semibold">
            {bien.loyerMensuelFcfa.toLocaleString("fr-FR")} FCFA
          </div>
        </div>
        <div className="border-line bg-surface rounded-md border p-4">
          <div className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
            Locataire
          </div>
          <div className="text-ink mt-1 text-[0.95rem] font-semibold">
            {locataire ? locataire.nom : "Aucun"}
          </div>
        </div>
      </div>

      <h2 className="font-display text-ink mt-10 text-[1.2rem] font-bold">Historique des loyers</h2>
      {paiements.length === 0 ? (
        <p className="text-ink-3 mt-3 text-[0.86rem]">Aucun paiement enregistré.</p>
      ) : (
        <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-line border-b">
                <th className="text-ink-3 px-4 py-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                  Période
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
                const statut = statutPaiementLabel[p.statut];
                return (
                  <tr key={p.id} className="border-line border-b last:border-0">
                    <td className="px-4 py-3">{p.periode}</td>
                    <td className="px-4 py-3 font-mono">
                      {p.montantFcfa.toLocaleString("fr-FR")} F
                    </td>
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
      )}
    </div>
  );
}
