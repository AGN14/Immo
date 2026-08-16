"use client";

import { useState } from "react";

/**
 * Le code du bien — le sésame que le locataire saisit pour rejoindre son
 * logement.
 *
 * Deux placements, parce qu'un seul ne suffisait pas : posé SUR la photo quand
 * il y en a une, en ligne sinon. La version absolue rendue hors d'une image
 * remontait sur les boutons d'action, le conteneur `relative` étant vide et
 * donc sans hauteur.
 */
export function CodeBien({
  code,
  surImage = false,
}: {
  code: string | null;
  surImage?: boolean;
}) {
  const [copie, setCopie] = useState(false);

  if (!code) return null;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : le code reste sélectionnable à la main.
    }
  };

  return (
    <button
      type="button"
      onClick={copier}
      title="Copier le code du bien"
      className={
        surImage
          ? "bg-ink/80 hover:bg-ink/95 text-on-primary absolute top-3 right-3 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition-colors"
          : "border-line bg-surface text-ink-2 hover:border-ink-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors"
      }
    >
      <span className={surImage ? "text-on-primary/70 font-normal" : "text-ink-3 font-normal"}>
        Code bien :
      </span>
      <span className={`font-mono tracking-wider ${surImage ? "" : "text-ink"}`}>{code}</span>
      <span
        className={surImage ? "border-on-primary/30 border-l pl-2" : "border-line text-primary border-l pl-2"}
        aria-hidden
      >
        {copie ? "Copié" : "Copier"}
      </span>
    </button>
  );
}