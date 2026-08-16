"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const JOURS = ["lu", "ma", "me", "je", "ve", "sa", "di"];
const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function versISO(d: Date): string {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

function depuisISO(iso: string | undefined): Date | null {
  if (!iso) return null;
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return null;
  const d = new Date(a, m - 1, j);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Grille de 42 jours (6 semaines), alignée sur lundi, avec les jours des
 *  mois voisins pour compléter les premières/dernières semaines — comme le
 *  calendrier natif du navigateur. */
function grilleDuMois(annee: number, mois: number): Date[] {
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7; // 0 = dimanche en JS ; on veut 0 = lundi.
  const debut = new Date(annee, mois, 1 - decalage);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(debut);
    d.setDate(debut.getDate() + i);
    return d;
  });
}

/**
 * Remplace <input type="date"> : la coquille se style, mais le calendrier
 * ouvert reste celui du système, hors de portée du CSS — même raison que
 * pour Select. Un input caché porte la valeur ISO (aaaa-mm-jj), donc les
 * actions serveur existantes n'ont rien à changer.
 */
export function DatePicker({
  label,
  name,
  hint,
  required,
  defaultValue,
  min,
  max,
  ariaLabel,
  compact = false,
  className = "",
}: {
  label?: string;
  name: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  /** Bornes au format ISO (aaaa-mm-jj), comme l'attribut natif. */
  min?: string;
  max?: string;
  /** Requis si `label` est omis (usage compact, sans libellé visible). */
  ariaLabel?: string;
  /** Gabarit réduit : champ isolé à côté d'un petit bouton, sans étiquette. */
  compact?: boolean;
  className?: string;
}) {
  const [valeur, setValeur] = useState<string | undefined>(defaultValue);
  const [ouvert, setOuvert] = useState(false);
  const dateSelectionnee = useMemo(() => depuisISO(valeur), [valeur]);
  const [vue, setVue] = useState(() => dateSelectionnee ?? new Date());
  const conteneurRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", surEchap);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", surEchap);
    };
  }, [ouvert]);

  /** Rouvre toujours sur le mois de la date choisie plutôt que là où le
   *  calendrier avait été laissé la dernière fois. */
  const basculer = () => {
    if (!ouvert) setVue(dateSelectionnee ?? new Date());
    setOuvert((o) => !o);
  };

  const dateMin = depuisISO(min);
  const dateMax = depuisISO(max);

  const estDesactive = (d: Date) => {
    if (dateMin && d < dateMin) return true;
    if (dateMax && d > dateMax) return true;
    return false;
  };

  const choisir = (d: Date) => {
    if (estDesactive(d)) return;
    setValeur(versISO(d));
    setOuvert(false);
  };

  const aujourdHui = new Date();
  const jours = grilleDuMois(vue.getFullYear(), vue.getMonth());

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={conteneurRef}>
      {label && (
        <span className="text-ink-2 text-sm font-medium" id={`${id}-label`}>
          {label}
        </span>
      )}

      <input type="hidden" name={name} value={valeur ?? ""} />

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={!label ? ariaLabel : undefined}
        onClick={basculer}
        className={`border-line bg-surface text-ink focus-visible:outline-primary flex items-center gap-2 rounded-md border focus-visible:outline-2 focus-visible:outline-offset-1 ${
          compact ? "px-2.5 py-1.5 text-sm" : "w-full justify-between px-3 py-2.5 text-base"
        }`}
      >
        <span className={dateSelectionnee ? "" : "text-ink-3"} data-numeric>
          {dateSelectionnee
            ? dateSelectionnee.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "jj/mm/aaaa"}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-3 size-4 shrink-0"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </button>
      {hint && <span className="text-ink-3 text-sm">{hint}</span>}

      {ouvert && (
        <div
          role="dialog"
          aria-label={label ?? ariaLabel ?? "Choisir une date"}
          className="border-line bg-surface animation-menu absolute top-full left-0 z-30 mt-1.5 w-72 origin-top rounded-md border p-3 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Année précédente"
                onClick={() => setVue((v) => new Date(v.getFullYear() - 1, v.getMonth(), 1))}
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 text-xs transition-colors"
              >
                «
              </button>
              <button
                type="button"
                aria-label="Mois précédent"
                onClick={() => setVue((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors"
              >
                ‹
              </button>
            </div>
            <span className="text-ink text-sm font-semibold capitalize">
              {MOIS[vue.getMonth()]} {vue.getFullYear()}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Mois suivant"
                onClick={() => setVue((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors"
              >
                ›
              </button>
              <button
                type="button"
                aria-label="Année suivante"
                onClick={() => setVue((v) => new Date(v.getFullYear() + 1, v.getMonth(), 1))}
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 text-xs transition-colors"
              >
                »
              </button>
            </div>
          </div>

          <div className="text-ink-3 mt-3 grid grid-cols-7 text-center text-xs">
            {JOURS.map((j) => (
              <span key={j}>{j}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {jours.map((j) => {
              const horsMois = j.getMonth() !== vue.getMonth();
              const estAujourdhui = versISO(j) === versISO(aujourdHui);
              const estSelectionne = valeur === versISO(j);
              const desactive = estDesactive(j);
              return (
                <button
                  key={j.toISOString()}
                  type="button"
                  disabled={desactive}
                  onClick={() => choisir(j)}
                  data-numeric
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-sm transition-colors ${
                    estSelectionne
                      ? "bg-primary text-on-primary font-semibold"
                      : desactive
                        ? "text-ink-3 cursor-not-allowed opacity-40"
                        : horsMois
                          ? "text-ink-3 hover:bg-sand"
                          : `text-ink hover:bg-sand ${estAujourdhui ? "border-primary border font-semibold" : ""}`
                  }`}
                >
                  {j.getDate()}
                </button>
              );
            })}
          </div>

          <div className="border-line mt-2 flex items-center justify-between border-t pt-2 text-sm">
            {!required && (
              <button
                type="button"
                onClick={() => {
                  setValeur(undefined);
                  setOuvert(false);
                }}
                className="text-ink-3 hover:text-ink font-medium transition-colors"
              >
                Effacer
              </button>
            )}
            <button
              type="button"
              onClick={() => choisir(aujourdHui)}
              disabled={estDesactive(aujourdHui)}
              className="text-primary ml-auto font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aujourd&rsquo;hui
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
