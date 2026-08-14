"use client";

import { useEffect } from "react";

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
