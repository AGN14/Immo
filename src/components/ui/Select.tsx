"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export interface OptionSelect {
  value: string;
  label: string;
}

/**
 * Remplace le <select> natif : la coquille fermée peut se styliser, mais le
 * panneau ouvert reste celui du système d'exploitation, hors de portée du
 * CSS. Ce composant rend les deux états lui-même, dans le langage du site.
 */
export function Select({
  label,
  name,
  value: valeurControlee,
  defaultValue,
  onChange,
  options,
  hint,
  className = "",
}: {
  label: string;
  name: string;
  /** Fournir `value` + `onChange` pour un champ contrôlé (ex. un choix qui
   *  fait apparaître d'autres champs). Sans eux, le composant gère seul son
   *  état — le cas courant d'un simple champ de formulaire. */
  value?: string;
  defaultValue?: string;
  onChange?: (valeur: string) => void;
  options: OptionSelect[];
  hint?: string;
  className?: string;
}) {
  const controle = valeurControlee !== undefined;
  const [valeurInterne, setValeurInterne] = useState(defaultValue ?? options[0]?.value ?? "");
  const value = controle ? valeurControlee : valeurInterne;

  const [ouvert, setOuvert] = useState(false);
  const [survole, setSurvole] = useState<string | null>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const declencheurRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  const selectionnee = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", auClic);
    return () => document.removeEventListener("mousedown", auClic);
  }, [ouvert]);

  const choisir = (v: string) => {
    if (!controle) setValeurInterne(v);
    onChange?.(v);
    setOuvert(false);
    declencheurRef.current?.focus();
  };

  const surClavier = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOuvert(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        setSurvole(value);
        return;
      }
      if (survole) choisir(survole);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        setSurvole(value);
        return;
      }
      const actuel = options.findIndex((o) => o.value === (survole ?? value));
      const suivant =
        e.key === "ArrowDown" ? Math.min(actuel + 1, options.length - 1) : Math.max(actuel - 1, 0);
      setSurvole(options[suivant].value);
    }
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={conteneurRef}>
      <span className="text-ink-2 text-sm font-medium" id={`${id}-label`}>
        {label}
      </span>
      <input type="hidden" name={name} value={value} />
      <button
        ref={declencheurRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-labelledby={`${id}-label`}
        onClick={() => setOuvert((o) => !o)}
        onKeyDown={surClavier}
        className="border-line bg-surface text-ink focus-visible:outline-primary flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
      >
        <span>{selectionnee?.label ?? "—"}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-ink-3 size-4 shrink-0 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {ouvert && (
        <ul
          role="listbox"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
          className="border-line bg-surface animation-menu absolute top-full z-20 mt-1.5 w-full origin-top rounded-md border p-1.5 shadow-md"
        >
          {options.map((o) => {
            const estSelectionne = o.value === value;
            const estSurvole = o.value === (survole ?? value);
            return (
              <li key={o.value} role="option" aria-selected={estSelectionne}>
                <button
                  type="button"
                  onClick={() => choisir(o.value)}
                  onMouseEnter={() => setSurvole(o.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    estSurvole ? "bg-highlight text-ink" : "text-ink-2"
                  }`}
                >
                  {o.label}
                  {estSelectionne && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary size-4 shrink-0"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {hint && <span className="text-ink-3 text-sm">{hint}</span>}
    </div>
  );
}
