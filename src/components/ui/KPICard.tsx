import type { ReactNode } from "react";

/** Mini-courbe : les périodes passées en ton atténué, la dernière en accent —
 *  une seule série, donc pas de légende à porter. */
function Sparkline({ valeurs }: { valeurs: number[] }) {
  if (valeurs.length < 2) return null;

  const largeur = 48;
  const hauteur = 24;
  const marge = 3;
  const max = Math.max(...valeurs);
  const min = Math.min(...valeurs);
  const echelle = max === min ? 0 : (hauteur - marge * 2) / (max - min);
  const pas = (largeur - marge * 2) / (valeurs.length - 1);

  const points = valeurs.map((v, i) => ({
    x: marge + i * pas,
    y: hauteur - marge - (v - min) * echelle,
  }));

  const chemin = (pts: typeof points) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const dernier = points[points.length - 1];
  const avantDernier = points[points.length - 2];

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="h-6 w-12 shrink-0" aria-hidden="true">
      <path
        d={chemin(points.slice(0, -1))}
        fill="none"
        stroke="var(--ink-3)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d={chemin([avantDernier, dernier])}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={dernier.x}
        cy={dernier.y}
        r="2.5"
        fill="var(--primary)"
        stroke="var(--surface)"
        strokeWidth="2"
      />
    </svg>
  );
}

/** Signé, coloré selon si la hausse est une bonne nouvelle pour CETTE mesure
 *  (un loyer en retard qui augmente n'est pas un succès vert). */
function DeltaBadge({ valeur, hausseSouhaitee }: { valeur: number; hausseSouhaitee: boolean }) {
  const positif = valeur >= 0;
  const favorable = positif === hausseSouhaitee;
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
        favorable ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
      }`}
      data-numeric
    >
      {positif ? "+" : ""}
      {valeur.toFixed(1)}%
    </span>
  );
}

export function KPICard({
  label,
  value,
  caption,
  icon,
  delta,
  hausseSouhaitee = true,
  tendance,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: ReactNode;
  /** Variation signée en %, vs la période précédente. Omis si pas de
   *  point de comparaison fiable — jamais estimé. */
  delta?: number;
  /** Une hausse de cette mesure est-elle une bonne nouvelle ? Détermine la
   *  couleur du badge, pas son signe. */
  hausseSouhaitee?: boolean;
  /** Valeurs des dernières périodes, la plus récente en dernier. */
  tendance?: number[];
}) {
  return (
    <div className="border-line bg-surface rounded-md border p-5">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-ink-3">{icon}</span>
          <span className="text-ink-3 text-sm font-medium">{label}</span>
        </div>
        {delta !== undefined && <DeltaBadge valeur={delta} hausseSouhaitee={hausseSouhaitee} />}
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="text-primary text-3xl font-semibold whitespace-nowrap" data-numeric>
            {value}
          </div>
          {caption && <div className="text-ink-3 mt-1 text-sm">{caption}</div>}
        </div>
        {tendance && tendance.length > 1 && <Sparkline valeurs={tendance} />}
      </div>
    </div>
  );
}
