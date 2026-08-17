"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * Défilement vers les sections sans laisser l'ancre dans la barre d'adresse.
 *
 * Les liens du site pointent vers `/#tarifs`, `/#temoignages`… Le navigateur
 * fait bien son travail, mais laisse le fragment visible — ce qui donne des
 * adresses peu soignées sur un site public.
 *
 * On intercepte donc au niveau du document plutôt que sur chaque lien : les
 * ancres sont dispersées dans cinq fichiers, dont des composants serveur qui
 * ne peuvent pas porter de gestionnaire d'événement. Un seul écouteur les
 * couvre toutes, y compris celles qu'on ajoutera plus tard.
 *
 * Ce qu'on ne casse pas :
 *   — le partage d'un lien vers une section, l'attribut `href` étant intact ;
 *   — la navigation depuis une autre page, où la cible n'existe pas : on laisse
 *     alors le navigateur suivre le lien normalement ;
 *   — l'ouverture dans un nouvel onglet (Ctrl/Cmd, clic du milieu).
 *
 * Ce qu'on perd, en revanche : le bouton « précédent » ne ramène plus à la
 * section précédente, puisqu'aucune entrée d'historique n'est créée. C'est le
 * prix de l'adresse propre, et il se paie une fois.
 */
export function DefilementAncres() {
  /**
   * Arrivée sur la page AVEC une ancre déjà dans l'adresse.
   *
   * Le clic était intercepté, mais pas l'arrivée : venant de /contact ou de
   * /a-propos — dont l'en-tête et le pied de page pointent vers `/#tarifs`,
   * `/#comment-ca-marche`… — le gestionnaire ci-dessous se retire volontairement
   * (la section n'existe pas sur la page de départ), le navigateur suit le lien,
   * et le fragment restait affiché. La même section donnait donc une adresse
   * propre ou non selon d'où l'on venait.
   *
   * Couvre au passage le clic parti avant l'hydratation, où l'écouteur n'est
   * pas encore posé.
   */
  // `useLayoutEffect` et non `useEffect` : le navigateur a pu restaurer une
  // ancienne position de défilement avant même que React n'hydrate. Corriger
  // ça avant la peinture évite un flash (page en bas, puis remontée).
  useLayoutEffect(() => {
    // Par défaut, le navigateur restaure lui-même la position de défilement
    // au rechargement (F5) ou au retour arrière — pratique dans une appli qui
    // gère ses propres listes, mais pas ici : une page publique rechargée
    // doit repartir du haut, sauf si l'adresse pointe explicitement vers une
    // section (cas géré plus bas).
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const ancre = window.location.hash.slice(1);
    if (!ancre) {
      window.scrollTo(0, 0);
      return;
    }

    const cible = document.getElementById(ancre);
    // Ancre inconnue : on ne touche à rien. Effacer le fragment masquerait une
    // adresse erronée au lieu de la laisser voir.
    if (!cible) return;

    // Une image du haut de page peut encore décaler la mise en page : on laisse
    // passer une frame avant de mesurer la position de la section.
    const image = requestAnimationFrame(() => {
      const animationsReduites = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cible.scrollIntoView({ behavior: animationsReduites ? "auto" : "smooth", block: "start" });
      cible.setAttribute("tabindex", "-1");
      cible.focus({ preventScroll: true });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    });

    return () => cancelAnimationFrame(image);
  }, []);

  useEffect(() => {
    const auClic = (evenement: MouseEvent) => {
      // Clic modifié : l'utilisateur veut un nouvel onglet, on n'intervient pas.
      if (evenement.defaultPrevented || evenement.button !== 0) return;
      if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;

      const lien = (evenement.target as HTMLElement | null)?.closest("a");
      if (!lien) return;

      const href = lien.getAttribute("href");
      if (!href || !href.includes("#")) return;
      if (lien.target && lien.target !== "_self") return;

      const [chemin, ancre] = href.split("#");
      if (!ancre) return;

      // Depuis une autre page, la section n'est pas là : navigation normale.
      const destination = chemin || window.location.pathname;
      if (destination !== window.location.pathname) return;

      const cible = document.getElementById(ancre);
      if (!cible) return;

      evenement.preventDefault();

      // Certaines personnes désactivent les animations pour raison médicale :
      // le réglage système fait foi.
      const animationsReduites = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cible.scrollIntoView({
        behavior: animationsReduites ? "auto" : "smooth",
        block: "start",
      });

      // Le clavier doit suivre le regard : sans ça, la tabulation reprendrait
      // en haut de page alors que l'écran affiche la section visée.
      cible.setAttribute("tabindex", "-1");
      cible.focus({ preventScroll: true });

      // `replaceState` et non `pushState` : on nettoie l'adresse sans empiler
      // une entrée d'historique par section visitée.
      window.history.replaceState(null, "", destination + window.location.search);
    };

    document.addEventListener("click", auClic);
    return () => document.removeEventListener("click", auClic);
  }, []);

  return null;
}
