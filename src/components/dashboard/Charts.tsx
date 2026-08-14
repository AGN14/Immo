/**
 * Graphiques de la vue d'ensemble — SVG dessiné à la main, sans dépendance.
 * Deux paires de barres par mois (encaissé / attendu), un anneau d'occupation.
 */

const HAUTEUR = 180;
const LARGEUR = 520;
const MARGE_BAS = 26;
const MARGE_HAUT = 12;

export function ChartLoyersMensuels({
  serie,
}: {
  serie: { periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[];
}) {
  const max = Math.max(...serie.map((s) => Math.max(s.encaisseFcfa, s.attenduFcfa)), 1);
  const largeurGroupe = LARGEUR / serie.length;
  const largeurBarre = Math.min(18, (largeurGroupe - 8) / 2);

  const hauteurDe = (valeur: number) => (valeur / max) * (HAUTEUR - MARGE_HAUT - MARGE_BAS);

  return (
    <div>
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        role="img"
        aria-label="Loyers encaissés et attendus par mois"
        className="w-full"
      >
        {/* Lignes de repère tous les 25 % de la hauteur. */}
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = HAUTEUR - MARGE_BAS - hauteurDe(max * f);
          return (
            <g key={f}>
              <line
                x1="0"
                x2={LARGEUR}
                y1={y}
                y2={y}
                className="stroke-line"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text
                x={LARGEUR - 2}
                y={y - 4}
                textAnchor="end"
                fontSize="10"
                className="fill-ink-3"
              >
                {Math.round(max * f).toLocaleString("fr-FR")}
              </text>
            </g>
          );
        })}

        {serie.map((s, i) => {
          const xCentre = i * largeurGroupe + largeurGroupe / 2;
          const xAttendu = xCentre - largeurBarre - 1;
          const xEncaissé = xCentre + 1;
          const hAttendu = hauteurDe(s.attenduFcfa);
          const hEncaissé = hauteurDe(s.encaisseFcfa);

          return (
            <g key={s.periode}>
              {/* Attendu : trait discret. Encaissé : plein. */}
              <rect
                x={xAttendu}
                y={HAUTEUR - MARGE_BAS - hAttendu}
                width={largeurBarre}
                height={hAttendu}
                rx="2"
                className="fill-sand stroke-line"
                strokeWidth="1"
              />
              <rect
                x={xEncaissé}
                y={HAUTEUR - MARGE_BAS - hEncaissé}
                width={largeurBarre}
                height={hEncaissé}
                rx="2"
                className="fill-primary"
              />
              <text
                x={xCentre}
                y={HAUTEUR - 8}
                textAnchor="middle"
                fontSize="11"
                className="fill-ink-3"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-end gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary inline-block size-2.5 rounded-sm" />
          <span className="text-ink-2">Encaissé</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="border-line inline-block size-2.5 rounded-sm border bg-transparent" />
          <span className="text-ink-2">Attendu</span>
        </span>
      </div>
    </div>
  );
}

export function DonutOccupation({
  taux,
  lotsLoues,
  lotsTotal,
}: {
  taux: number;
  lotsLoues: number;
  lotsTotal: number;
}) {
  const rayon = 44;
  const circonference = 2 * Math.PI * rayon;
  const fraction = lotsTotal > 0 ? lotsLoues / lotsTotal : 0;
  const decalage = circonference * (1 - fraction);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0" role="img" aria-label="Taux d'occupation">
        <circle
          cx="60"
          cy="60"
          r={rayon}
          fill="none"
          strokeWidth="12"
          className="stroke-line"
        />
        <circle
          cx="60"
          cy="60"
          r={rayon}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          strokeDasharray={circonference}
          strokeDashoffset={decalage}
          className="fill-none stroke-primary"
        />
        <text
          x="60"
          y="57"
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          className="fill-ink"
        >
          {taux}%
        </text>
        <text x="60" y="73" textAnchor="middle" fontSize="9" className="fill-ink-3">
          occupés
        </text>
      </svg>
      <div className="text-sm">
        <p className="text-ink-2">
          <span className="text-ink font-semibold" data-numeric>
            {lotsLoues} / {lotsTotal}
          </span>{" "}
          lots loués
        </p>
        <p className="text-ink-3 mt-1">
          {lotsTotal === 0
            ? "Aucun lot dans votre parc pour l'instant."
            : lotsLoues === lotsTotal
              ? "Parc entièrement loué."
              : `${lotsTotal - lotsLoues} lot${lotsTotal - lotsLoues > 1 ? "s" : ""} encore libre${lotsTotal - lotsLoues > 1 ? "s" : ""}.`}
        </p>
      </div>
    </div>
  );
}
