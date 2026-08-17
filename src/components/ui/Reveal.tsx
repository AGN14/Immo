"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Courbe reprise d'une référence dont le rendu a été jugé fluide (`ease`
// simple, sans courbe maison). La durée, elle, a été rallongée par rapport à
// cette même référence : à 650ms l'apparition avait déjà eu lieu avant que
// l'œil n'arrive dessus en scrollant normalement.
const DUREE = "900ms";
const COURBE = "cubic-bezier(0.25, 0.1, 0.25, 1)"; // = `ease`

// Réaction au survol (ombre, lift…) : nettement plus courte que l'apparition,
// sinon un geste de souris met une demi-seconde à répondre.
const DUREE_SURVOL = "250ms";

const CACHE = "translate-y-6 opacity-0";
const VISIBLE = "translate-y-0 opacity-100";

/**
 * Apparition discrète au scroll, sous forme de hook : à poser directement sur
 * l'élément qui doit garder sa balise (un `li` dans un `ol`, un `article`…),
 * là où `<Reveal>` imposerait un `div` en plus et casserait la structure.
 *
 * `delayMs` sert à faire cascader plusieurs éléments voisins (cartes d'une
 * grille) plutôt que de les faire apparaître tous d'un bloc.
 *
 * `proprieteSurvol` déclare une propriété CSS supplémentaire animée au survol
 * sur ce même élément (ex. `"box-shadow"`) : elle rejoint la même liste
 * `transition-property` que l'apparition, avec sa propre durée plus courte,
 * au lieu d'entrer en conflit avec elle (deux classes Tailwind `transition-*`
 * sur le même élément ne se cumulent pas : la dernière déclarée dans la
 * feuille de styles écrase l'autre en entier). Ne convient que si la
 * propriété de survol est distincte de `transform` — sinon (ex. un
 * `hover:-translate-y-1`), l'apparition et le survol se disputeraient la même
 * durée ; séparer l'apparition et l'interaction sur deux éléments (voir
 * Pricing) est alors la bonne solution.
 */
export function useReveal<T extends HTMLElement>(delayMs = 0, proprieteSurvol?: string) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      // Déclenché dès l'entrée dans le viewport (pas 80px plus tard, une fois
      // déjà bien visible) : l'apparition se joue pendant que l'élément monte
      // à l'écran, pas après coup.
      { threshold: 0, rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: CSSProperties = proprieteSurvol
    ? {
        transitionProperty: `opacity, transform, ${proprieteSurvol}`,
        transitionDuration: `${DUREE}, ${DUREE}, ${DUREE_SURVOL}`,
        transitionTimingFunction: `${COURBE}, ${COURBE}, ${COURBE}`,
        transitionDelay: `${delayMs}ms, ${delayMs}ms, 0ms`,
      }
    : {
        transitionProperty: "opacity, transform",
        transitionDuration: DUREE,
        transitionTimingFunction: COURBE,
        transitionDelay: delayMs ? `${delayMs}ms` : undefined,
      };

  return {
    ref,
    visible,
    className: `${visible ? VISIBLE : CACHE} motion-reduce:transition-none`,
    style,
  };
}

/**
 * Apparition discrète au scroll. Réservée aux blocs de section : le texte courant
 * ne doit jamais dépendre du JS pour être lisible.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  proprieteSurvol,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  proprieteSurvol?: string;
}) {
  const {
    ref,
    className: classesRevelation,
    style,
  } = useReveal<HTMLDivElement>(delayMs, proprieteSurvol);

  return (
    <div ref={ref} style={style} className={`${classesRevelation} ${className}`}>
      {children}
    </div>
  );
}
