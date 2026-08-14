import Link from "next/link";
import { getLocataireByBienId } from "@/lib/mock-data";
import { statutOccupationLabel } from "@/lib/status-labels";
import type { Bien } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";

const typeLabel: Record<Bien["type"], string> = {
  appartement: "Appartement",
  villa: "Villa",
  studio: "Studio",
  immeuble: "Immeuble",
};

export function BienCard({ bien }: { bien: Bien }) {
  const locataire = bien.locataireId ? getLocataireByBienId(bien.id) : undefined;
  const occupation = statutOccupationLabel[bien.statutOccupation];

  return (
    <Link
      href={`/biens/${bien.id}`}
      className="border-line bg-surface hover:border-primary flex flex-col gap-3 rounded-md border p-5 no-underline transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-ink text-[1rem] font-bold">{bien.nom}</div>
          <div className="text-ink-3 mt-0.5 text-[0.78rem]">
            {bien.quartier}, {bien.ville}
          </div>
        </div>
        <StatusPill tone={occupation.tone}>{occupation.label}</StatusPill>
      </div>

      <div className="text-ink-3 text-[0.78rem]">{typeLabel[bien.type]}</div>

      <div className="border-line flex items-center justify-between border-t pt-3">
        <span className="text-ink-3 text-[0.78rem]">
          {locataire ? locataire.nom : "Aucun locataire"}
        </span>
        <span className="font-mono text-[0.86rem] font-semibold">
          {bien.loyerMensuelFcfa.toLocaleString("fr-FR")} F/mois
        </span>
      </div>
    </Link>
  );
}
