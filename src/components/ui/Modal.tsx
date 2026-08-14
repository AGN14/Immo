"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fenêtre modale maison : fond assombri, panneau centré, fermeture par Échap
 * ou clic sur le fond. Le formulaire est fourni par l'appelant.
 */
export function Modal({
  ouvert,
  surFermer,
  titre,
  children,
}: {
  ouvert: boolean;
  surFermer: () => void;
  titre: string;
  children: ReactNode;
}) {
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") surFermer();
    };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert, surFermer]);

  if (!ouvert) return null;

  return (
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) surFermer();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        ref={panneau}
        className="border-line bg-paper w-full max-w-lg rounded-lg border p-6 shadow-lg"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-ink text-xl font-semibold">{titre}</h2>
          <button
            type="button"
            onClick={surFermer}
            aria-label="Fermer"
            className="text-ink-3 hover:text-ink rounded p-1 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
