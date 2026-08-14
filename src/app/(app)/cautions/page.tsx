import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { planSuffisant } from "@/lib/plans";
import { getBaux, getBiens, getCautions, getLots, getLocataires } from "@/lib/data";
import { StatusPill } from "@/components/ui/StatusPill";
import { BoutonAvancerCaution } from "@/components/cautions/BoutonAvancerCaution";
import type { StatutCaution } from "@/lib/types";

export const metadata = { title: "Cautions" };

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

const statutCaution: Record<StatutCaution, { label: string; tone: "warn" | "ok" | "mute" }> = {
  due: { label: "À encaisser", tone: "warn" },
  encaisee: { label: "Encaissée", tone: "ok" },
  restituee: { label: "Restituée", tone: "mute" },
};

/** Dépôts de garantie des baux — réservé au plan Business. */
export default async function CautionsPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business")) redirect("/plans");

  const [cautions, baux, locataires, lots, biens] = await Promise.all([
    getCautions(proprietaireId),
    getBaux(proprietaireId),
    getLocataires(proprietaireId),
    getLots(proprietaireId),
    getBiens(proprietaireId),
  ]);

  const locataireParId = new Map(locataires.map((l) => [l.id, l]));
  const bailParId = new Map(baux.map((b) => [b.id, b]));
  const lotParId = new Map(lots.map((l) => [l.id, l]));
  const bienParLotId = new Map(lots.map((l) => [l.id, biens.find((b) => b.id === l.bienId)]));

  const totalEncaissableFcfa = cautions
    .filter((c) => c.statut === "due")
    .reduce((s, c) => s + c.montantFcfa, 0);

  return (
    <div>
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Cautions</h1>
        <p className="text-ink-2 mt-2">
          {cautions.length === 0
            ? "Les dépôts de garantie apparaîtront ici dès l'attribution d'un logement avec caution."
            : `${totalEncaissableFcfa.toLocaleString("fr-FR")} F de cautions à encaisser.`}
        </p>
      </div>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        {cautions.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucune caution enregistrée pour l&rsquo;instant.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Locataire</th>
                <th className={th}>Logement</th>
                <th className={`${th} text-right`}>Montant</th>
                <th className={th}>Statut</th>
                <th className={th}>Historique</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {cautions.map((caution) => {
                const bail = bailParId.get(caution.bailId);
                const locataire = bail ? locataireParId.get(bail.locataireId) : undefined;
                const lot = bail ? lotParId.get(bail.lotId) : undefined;
                const bien = lot ? bienParLotId.get(lot.id) : undefined;
                const etat = statutCaution[caution.statut];
                const dates = [
                  caution.encaisseeLe
                    ? `Encaissée le ${new Date(caution.encaisseeLe).toLocaleDateString("fr-FR")}`
                    : null,
                  caution.restitueeLe
                    ? `Restituée le ${new Date(caution.restitueeLe).toLocaleDateString("fr-FR")}`
                    : null,
                ].filter(Boolean);
                return (
                  <tr key={caution.id} className="text-ink">
                    <td className="px-4 py-3">
                      <Link
                        href={`/locataires/${locataire?.id ?? ""}`}
                        className="text-ink hover:text-primary font-semibold no-underline"
                      >
                        {locataire?.nom ?? "—"}
                      </Link>
                    </td>
                    <td className="text-ink-2 px-4 py-3">
                      {bien ? `${bien.nom} — ` : ""}
                      {lot?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums" data-numeric>
                      {caution.montantFcfa.toLocaleString("fr-FR")} F
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={etat.tone}>{etat.label}</StatusPill>
                    </td>
                    <td className="text-ink-3 px-4 py-3 text-xs">
                      {dates.length > 0 ? dates.join(" · ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <BoutonAvancerCaution cautionId={caution.id} statut={caution.statut} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}