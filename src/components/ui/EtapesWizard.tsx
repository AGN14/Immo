export function EtapesWizard({
  etapes,
  etape,
  aller,
}: {
  etapes: string[];
  etape: number;
  aller: (n: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {etapes.map((label, i) => {
        const n = i + 1;
        const fait = n < etape;
        const actif = n === etape;
        return (
          <li key={label} className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => aller(n)}
              aria-current={actif ? "step" : undefined}
              title={label}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium transition-colors ${
                actif ? "text-ink" : fait ? "text-ink-2" : "text-ink-3"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  actif
                    ? "bg-primary text-on-primary"
                    : fait
                      ? "bg-primary-soft text-primary"
                      : "bg-sand text-ink-3"
                }`}
                aria-hidden="true"
              >
                {fait ? "✓" : n}
              </span>
              {/* Seule l'étape active porte son intitulé : avec quatre étapes
                  et des libellés longs ("Pièce d'identité", "Suivi du
                  dossier"), les écrire tous dépassait la largeur de la
                  fenêtre modale. Les autres restent lisibles au survol. */}
              {actif && <span className="hidden sm:inline">{label}</span>}
            </button>
            {n < etapes.length && (
              <span className="border-line h-px w-3 shrink-0 sm:w-5" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
