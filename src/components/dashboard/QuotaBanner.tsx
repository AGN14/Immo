import Link from "next/link";
import type { Quota } from "@/lib/plans";

/**
 * Prévient avant le mur plutôt qu'au moment de l'ajout, et ne bloque jamais la
 * lecture : les baux déjà enregistrés restent consultables en toutes circonstances.
 */
export function QuotaBanner({ quota }: { quota: Quota }) {
  if (quota.illimite) {
    return (
      <p className="text-ink-3 mt-4 text-sm">
        Palier {quota.plan.nom} — logements loués illimités.
      </p>
    );
  }

  const { utilises, max, niveau, restants, suivant, plan } = quota;
  const pourcentage = Math.min(100, Math.round((utilises / (max ?? 1)) * 100));

  const ton =
    niveau === "atteint"
      ? { bordure: "border-danger", barre: "bg-danger", fond: "bg-danger-soft" }
      : niveau === "proche"
        ? { bordure: "border-amber", barre: "bg-amber", fond: "bg-surface" }
        : { bordure: "border-line", barre: "bg-primary", fond: "bg-surface" };

  return (
    <div className={`mt-6 rounded-md border p-4 ${ton.bordure} ${ton.fond}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-ink text-sm font-semibold">
          <span data-numeric>
            {utilises} / {max}
          </span>{" "}
          logements loués — palier {plan.nom}
        </span>
        {niveau === "atteint" ? (
          <span className="text-danger text-sm font-semibold">Limite atteinte</span>
        ) : (
          <span className="text-ink-3 text-sm">
            {restants} {restants === 1 ? "place restante" : "places restantes"}
          </span>
        )}
      </div>

      <div className="bg-sand rounded-pill mt-2.5 h-1.5 w-full overflow-hidden">
        <div className={`rounded-pill h-full ${ton.barre}`} style={{ width: `${pourcentage}%` }} />
      </div>

      {niveau !== "ok" && suivant && (
        <p className="text-ink-2 mt-3 text-sm">
          {niveau === "atteint"
            ? "Pour mettre un logement de plus en location, passez au palier supérieur."
            : "Vous approchez de la limite de votre palier."}{" "}
          <Link href="/#tarifs" className="text-primary font-semibold no-underline">
            Passer en {suivant.nom}
            {suivant.maxBaux === null ? " (illimité)" : ` (jusqu'à ${suivant.maxBaux} logements)`}
          </Link>
        </p>
      )}

      {niveau === "atteint" && (
        <p className="text-ink-3 mt-2 text-sm">
          Vos logements actuels restent consultables, et un départ libère une place.
        </p>
      )}
    </div>
  );
}
