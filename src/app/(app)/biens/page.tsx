import { getBauxActifs, getBiens, getLots } from "@/lib/mock-data";
import { evaluerQuota } from "@/lib/plans";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { BienCard } from "@/components/dashboard/BienCard";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";

export default async function BiensPage() {
  const { proprietaireId, plan } = await requireProprietaire();

  const biens = getBiens(proprietaireId);
  const lots = getLots(proprietaireId);
  const quota = evaluerQuota(plan, getBauxActifs(proprietaireId).length);

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Biens</h1>
      <p className="text-ink-2 mt-2">
        {biens.length} {biens.length === 1 ? "bien" : "biens"}, {lots.length}{" "}
        {lots.length === 1 ? "lot" : "lots"} dans votre parc locatif.
      </p>

      <QuotaBanner quota={quota} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {biens.map((bien) => (
          <BienCard key={bien.id} bien={bien} proprietaireId={proprietaireId} />
        ))}
      </div>
    </div>
  );
}
