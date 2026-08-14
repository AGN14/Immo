import Link from "next/link";
import { getBailActifByLotId, getLotsByBienId } from "@/lib/data";
import { equipementLabel, type CleEquipement, typeBienLabel } from "@/lib/status-labels";
import { CodeBien } from "@/components/biens/CodeBien";
import type { Bien } from "@/lib/types";

const equipements = Object.keys(equipementLabel) as CleEquipement[];

function PhotoPlaceholder() {
  return (
    <div className="bg-sand grid h-36 place-items-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-ink-3 size-8"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    </div>
  );
}

export async function BienCard({ bien, proprietaireId }: { bien: Bien; proprietaireId: string }) {
  const lots = await getLotsByBienId(proprietaireId, bien.id);
  const baux = (
    await Promise.all(lots.map((l) => getBailActifByLotId(proprietaireId, l.id)))
  ).filter((b) => b !== undefined);
  const loues = baux.length;
  const revenus = baux.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const sesEquipements = equipements.filter((e) => bien[e]);

  return (
    <Link
      href={`/biens/${bien.id}`}
      className="border-line bg-surface hover:border-primary group flex flex-col overflow-hidden rounded-md border no-underline transition-colors"
    >
      {bien.imageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bien.imageUrl}
            alt={`${bien.nom} — ${bien.quartier}, ${bien.ville}`}
            className="h-36 w-full object-cover"
          />
          <CodeBien code={bien.code} />
        </div>
      ) : (
        <div className="relative">
          <PhotoPlaceholder />
          <CodeBien code={bien.code} />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <h3 className="text-ink font-sans text-base font-semibold">{bien.nom}</h3>
          <p className="text-ink-3 text-sm">
            {bien.quartier}, {bien.ville} · {typeBienLabel[bien.type]}
            {bien.superficieM2 ? (
              <span className="text-ink-2 font-medium" data-numeric>
                {" "}· {bien.superficieM2} m²
              </span>
            ) : null}
          </p>
        </div>

        {bien.description && (
          <p className="text-ink-2 text-sm leading-relaxed [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {bien.description}
          </p>
        )}

        {sesEquipements.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {sesEquipements.map((e) => (
              <span
                key={e}
                className="border-line bg-sand text-ink-2 rounded-full border px-2.5 py-0.5 text-xs font-medium"
              >
                {equipementLabel[e]}
              </span>
            ))}
          </div>
        )}

        <div className="border-line flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-ink-2" data-numeric>
            {loues} / {lots.length} {lots.length === 1 ? "lot loué" : "lots loués"}
          </span>
          <span className="text-primary font-semibold" data-numeric>
            {revenus.toLocaleString("fr-FR")} F/mois
          </span>
        </div>
      </div>
    </Link>
  );
}
