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
  const total = max ?? 1;

  const ton =
    niveau === "atteint"
      ? {
          bordure: "border-danger",
          barre: "bg-danger",
          fond: "bg-danger-soft",
          icone: "bg-danger-soft text-danger",
        }
      : niveau === "proche"
        ? {
            bordure: "border-amber",
            barre: "bg-amber",
            fond: "bg-surface",
            icone: "bg-amber/15 text-amber",
          }
        : {
            bordure: "border-line",
            barre: "bg-primary",
            fond: "bg-surface",
            icone: "bg-primary-soft text-primary",
          };

  return (
    <div className={`mt-6 rounded-md border p-4 ${ton.bordure} ${ton.fond}`}>
      <div className="flex items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full ${ton.icone}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </svg>
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
      </div>

      {/* Un segment par logement du palier plutôt qu'une barre continue :
          chaque case compte quelque chose de réel, pas juste un pourcentage. */}
      <div className="mt-3 flex gap-1" role="img" aria-label={`${utilises} logements loués sur ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-3 min-w-0 flex-1 rounded-full transition-colors ${
              i < utilises ? ton.barre : "bg-sand"
            }`}
          />
        ))}
      </div>

      {niveau !== "ok" && suivant && (
        <p className="text-ink-2 mt-3 text-sm">
          {niveau === "atteint"
            ? "Pour mettre un logement de plus en location, passez au palier supérieur."
            : "Vous approchez de la limite de votre palier."}{" "}
          <Link href="/plans" className="text-primary font-semibold no-underline">
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
