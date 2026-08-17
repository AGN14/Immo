"use client";

import { useEffect, useState } from "react";

const DUREE_COMPTEUR_MS = 1200;

/** Compte de 0 à `cible` une fois `actif` (typiquement `visible` de
 *  `useReveal`). Ignoré si l'utilisateur préfère limiter les animations : la
 *  valeur finale s'affiche dès la première frame. */
export function useCompteur(cible: number, actif: boolean) {
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    if (!actif || cible === 0) return;

    // Mouvement réduit : la valeur finale s'affiche dès la première frame au
    // lieu de compter, mais `setValeur` reste appelé depuis le callback du
    // rAF plutôt que dans le corps de l'effet.
    const dureeMs = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : DUREE_COMPTEUR_MS;

    let debut: number | null = null;
    let frame: number;
    const etape = (t: number) => {
      if (debut === null) debut = t;
      const progres = dureeMs === 0 ? 1 : Math.min((t - debut) / dureeMs, 1);
      const adouci = 1 - Math.pow(1 - progres, 3); // décélère en fin de course
      setValeur(Math.round(adouci * cible));
      if (progres < 1) frame = requestAnimationFrame(etape);
    };
    frame = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(frame);
  }, [actif, cible]);

  return valeur;
}
