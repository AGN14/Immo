/**
 * Graphiques de la vue d'ensemble — SVG dessiné à la main, sans dépendance.
 * Deux paires de barres par mois (encaissé / attendu), un anneau d'occupation.
 */

"use client";

import { useState } from "react";

const HAUTEUR = 200;
const LARGEUR = 560;
const MARGE_BAS = 28;
const MARGE_HAUT = 16;
// Réservée aux valeurs de repère : sans elle, le groupe du dernier mois les
// recouvrait, illisible pile là où le lecteur regarde en premier.
const MARGE_DROITE = 54;

/** Rectangle arrondi seulement en haut : la barre pousse depuis une base
 *  nette, comme une vraie colonne plutôt qu'une pilule. */
function cheminBarre(x: number, y: number, largeur: number, hauteur: number, rayon: number) {
  if (hauteur <= 0) return "";
  const r = Math.min(rayon, largeur / 2, hauteur);
  return `M${x},${y + hauteur} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + largeur - r},${y} Q${x + largeur},${y} ${x + largeur},${y + r} L${x + largeur},${y + hauteur} Z`;
}

export function ChartLoyersMensuels({
  serie,
}: {
  serie: { periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[];
}) {
  const [survole, setSurvole] = useState<number | null>(null);

  if (serie.length === 0) return null;

  const max = Math.max(...serie.map((s) => Math.max(s.encaisseFcfa, s.attenduFcfa)), 1);
  const largeurTrace = LARGEUR - MARGE_DROITE;
  const largeurGroupe = largeurTrace / serie.length;
  const largeurBarre = Math.min(20, (largeurGroupe - 10) / 2);

  const hauteurDe = (valeur: number) => (valeur / max) * (HAUTEUR - MARGE_HAUT - MARGE_BAS);

  const actif = survole ?? serie.length - 1;
  const moisActif = serie[actif];
  const tauxActif =
    moisActif.attenduFcfa > 0
      ? Math.round((moisActif.encaisseFcfa / moisActif.attenduFcfa) * 100)
      : null;

  return (
    <div>
      {/* Lecture précise du mois survolé (le dernier par défaut) : la barre
          donne la forme, ce bandeau donne le chiffre exact — jamais que
          l'un des deux. */}
      <div className="flex items-baseline gap-2.5">
        <span className="text-ink-3 text-xs font-medium tracking-wide uppercase">
          {moisActif.label}
        </span>
        <span className="text-ink text-xl font-semibold" data-numeric>
          {moisActif.encaisseFcfa.toLocaleString("fr-FR")} F
        </span>
        {tauxActif !== null && (
          <span
            className={`text-xs font-semibold ${tauxActif >= 100 ? "text-success" : "text-ink-3"}`}
            data-numeric
          >
            {tauxActif}&nbsp;% de l&rsquo;attendu
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        role="img"
        aria-label="Loyers encaissés et attendus par mois"
        className="mt-2 w-full"
        onMouseLeave={() => setSurvole(null)}
      >
        {/* Lignes de repère tous les 25 % de la hauteur : hairline pleine,
            jamais pointillée — c'est du décor, pas une donnée. */}
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = HAUTEUR - MARGE_BAS - hauteurDe(max * f);
          return (
            <g key={f}>
              <line
                x1="0"
                x2={largeurTrace}
                y1={y}
                y2={y}
                className="stroke-line-soft"
                strokeWidth="1"
              />
              <text x={largeurTrace + 8} y={y + 3} fontSize="10" className="fill-ink-3">
                {Math.round(max * f).toLocaleString("fr-FR")}
              </text>
            </g>
          );
        })}

        {serie.map((s, i) => {
          const xCentre = i * largeurGroupe + largeurGroupe / 2;
          const xAttendu = xCentre - largeurBarre - 1;
          const xEncaisse = xCentre + 1;
          const hAttendu = hauteurDe(s.attenduFcfa);
          const hEncaisse = hauteurDe(s.encaisseFcfa);
          const estSurvole = i === actif;

          return (
            <g
              key={s.periode}
              onMouseEnter={() => setSurvole(i)}
              onFocus={() => setSurvole(i)}
              tabIndex={0}
              className="cursor-pointer outline-none"
              opacity={survole !== null && !estSurvole ? 0.45 : 1}
              style={{ transition: "opacity 150ms ease-out" }}
            >
              {/* Cible de survol : toute la colonne du mois, pas juste les 2
                  barres fines — on vise un mois, pas 20 px. */}
              <rect
                x={i * largeurGroupe}
                y="0"
                width={largeurGroupe}
                height={HAUTEUR - MARGE_BAS}
                fill="transparent"
              />
              <path
                d={cheminBarre(xAttendu, HAUTEUR - MARGE_BAS - hAttendu, largeurBarre, hAttendu, 4)}
                className="fill-sand stroke-line"
                strokeWidth="1"
              />
              <path
                d={cheminBarre(
                  xEncaisse,
                  HAUTEUR - MARGE_BAS - hEncaisse,
                  largeurBarre,
                  hEncaisse,
                  4,
                )}
                className="fill-primary"
              />
              <text
                x={xCentre}
                y={HAUTEUR - 8}
                textAnchor="middle"
                fontSize="11"
                className={estSurvole ? "fill-ink font-semibold" : "fill-ink-3"}
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
          <span className="border-line bg-sand inline-block size-2.5 rounded-sm border" />
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

/** Barres horizontales : encaissement confirmé par bien, du plus gros au plus
 *  petit. SVG dessiné à la main, comme le reste des graphiques. */
export function ChartEncaissementParBien({
  lignes,
}: {
  lignes: { label: string; valeurFcfa: number }[];
}) {
  const max = Math.max(...lignes.map((l) => l.valeurFcfa), 1);
  const hauteurLigne = 34;
  const largeur = 520;
  const hauteur = lignes.length * hauteurLigne + 8;

  return (
    <div>
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        role="img"
        aria-label="Encaissements par bien"
        className="w-full"
      >
        {lignes.map((ligne, i) => {
          const y = 20 + i * hauteurLigne;
          const largeurBarre = (ligne.valeurFcfa / max) * (largeur - 130);
          return (
            <g key={ligne.label}>
              <text x="0" y={y + 4} fontSize="11" className="fill-ink-2">
                {ligne.label.length > 22 ? `${ligne.label.slice(0, 20)}…` : ligne.label}
              </text>
              <rect
                x="130"
                y={y - 10}
                width={Math.max(largeurBarre, ligne.valeurFcfa > 0 ? 3 : 0)}
                height="14"
                rx="3"
                className="fill-primary"
              />
              <text
                x="520"
                y={y + 4}
                fontSize="11"
                fontWeight="600"
                textAnchor="end"
                className="fill-ink"
              >
                {ligne.valeurFcfa.toLocaleString("fr-FR")} F
              </text>
            </g>
          );
        })}
      </svg>
      {lignes.length === 0 && (
        <p className="text-ink-3 text-center text-sm">Aucun encaissement pour l&rsquo;instant.</p>
      )}
    </div>
  );
}
