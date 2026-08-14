import { requireProprietaire } from "@/lib/auth/mock-session";
import { redirect } from "next/navigation";
import { planSuffisant } from "@/lib/plans";
import { supabaseServer } from "@/lib/supabase/server";
import { getProprietaireById } from "@/lib/data";
import { StatusPill } from "@/components/ui/StatusPill";
import { FormulaireJourReversement } from "@/components/profil/FormulaireJourReversement";

export const metadata = { title: "Reversements" };

const statutsReversement = {
  prevu: { label: "Prévu", tone: "mute" as const },
  envoye: { label: "Envoyé", tone: "ok" as const },
  echoue: { label: "Échoué", tone: "warn" as const },
};

function prochainReversement(jour: number) {
  const maintenant = new Date();
  const prochain = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, jour);
  return prochain.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ReversementsPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "pro")) redirect("/plans");
  const compte = await getProprietaireById(proprietaireId);

  const { data: reversements } = await supabaseServer()
    .from("reversement")
    .select("*")
    .eq("proprietaire_id", proprietaireId)
    .order("periode", { ascending: false });

  const totalNet = (reversements ?? []).reduce((sum, r) => sum + r.montant_net_fcfa, 0);

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Reversements</h1>
      <p className="text-ink-2 mt-2">
        Chaque mois, Immo reverse les loyers collectés et confirmés, déduction faite de la
        commission.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-line bg-surface rounded-md border p-5">
          <div className="text-ink-3 text-sm font-medium">Prochain reversement</div>
          <div className="text-primary mt-3 text-3xl font-semibold" data-numeric>
            {compte ? `${compte.jourReversement}` : "—"}
          </div>
          <div className="text-ink-3 mt-1 text-sm">
            {compte ? prochainReversement(compte.jourReversement) : ""}
          </div>
        </div>
        <div className="border-line bg-surface rounded-md border p-5">
          <div className="text-ink-3 text-sm font-medium">Reversements passés</div>
          <div className="text-primary mt-3 text-3xl font-semibold" data-numeric>
            {(reversements ?? []).length}
          </div>
          <div className="text-ink-3 mt-1 text-sm">Au total</div>
        </div>
        <div className="border-line bg-surface rounded-md border p-5">
          <div className="text-ink-3 text-sm font-medium">Net total reçu</div>
          <div className="text-primary mt-3 text-3xl font-semibold" data-numeric>
            {totalNet.toLocaleString("fr-FR")} F
          </div>
          <div className="text-ink-3 mt-1 text-sm">Commission déduite</div>
        </div>
      </div>

      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <h2 className="font-display text-ink text-lg font-semibold">Réglage</h2>
        <p className="text-ink-2 mt-1 text-sm">
          Le jour choisi s&rsquo;applique à chaque reversement mensuel.
        </p>
        <div className="mt-4">
          <FormulaireJourReversement jour={compte?.jourReversement ?? 1} />
        </div>
      </div>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Période</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Montant brut</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Commission</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Net</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Prévu le</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Exécuté le</th>
              <th className="text-ink-2 px-4 py-3 text-sm font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(reversements ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="text-ink-3 px-4 py-12 text-center">
                  Aucun reversement pour l&rsquo;instant. Les loyers confirmés seront reversés
                  automatiquement le jour choisi.
                </td>
              </tr>
            )}
            {(reversements ?? []).map((r) => {
              const statut = statutsReversement[r.statut as keyof typeof statutsReversement];
              return (
                <tr key={r.id} className="border-line border-b last:border-0">
                  <td className="text-ink px-4 py-3 font-semibold" data-numeric>
                    {r.periode}
                  </td>
                  <td className="text-ink-2 px-4 py-3" data-numeric>
                    {r.montant_brut_fcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-ink-2 px-4 py-3" data-numeric>
                    {r.commission_fcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-primary px-4 py-3 font-semibold" data-numeric>
                    {r.montant_net_fcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-ink-2 px-4 py-3">
                    {r.prevu_le ? new Date(r.prevu_le).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="text-ink-2 px-4 py-3">
                    {r.execute_le ? new Date(r.execute_le).toLocaleDateString("fr-FR") : "—"}
                  </td>
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
