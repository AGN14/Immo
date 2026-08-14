"use client";

import { useState } from "react";

/** Le code du bien, en badge sur l'image — le sésame du locataire. */
export function CodeBien({ code }: { code: string | null }) {
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
      className="bg-ink/80 hover:bg-ink/95 text-on-primary absolute top-3 right-3 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition-colors"
    >
      <span className="text-on-primary/70 font-normal">Code bien :</span>
      <span className="font-mono tracking-wider">{code}</span>
      <span className="border-on-primary/30 border-l pl-2" aria-hidden>
        {copie ? "Copié" : "Copier"}
      </span>
    </button>
  );
}