import Link from "next/link";
import { getBailActifByLotId, getLotsByBienId } from "@/lib/mock-data";
import { typeBienLabel } from "@/lib/status-labels";
import type { Bien } from "@/lib/types";

export function BienCard({ bien, proprietaireId }: { bien: Bien; proprietaireId: string }) {
  const lots = getLotsByBienId(proprietaireId, bien.id);
  const baux = lots
    .map((l) => getBailActifByLotId(proprietaireId, l.id))
    .filter((b) => b !== undefined);
  const loues = baux.length;
  const revenus = baux.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);

  return (
    <Link
      href={`/biens/${bien.id}`}
      className="border-line bg-surface hover:border-primary flex flex-col gap-3 rounded-md border p-5 no-underline transition-colors"
    >
      <div>
        <h3 className="text-ink font-sans text-base font-semibold">{bien.nom}</h3>
        <p className="text-ink-3 text-sm">
          {bien.quartier}, {bien.ville} · {typeBienLabel[bien.type]}
        </p>
      </div>

      <div className="border-line flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-ink-2" data-numeric>
          {loues} / {lots.length} {lots.length === 1 ? "lot loué" : "lots loués"}
        </span>
        <span className="text-primary font-semibold" data-numeric>
          {revenus.toLocaleString("fr-FR")} F/mois
        </span>
      </div>
    </Link>
  );
}
