"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mesure d'audience interne, sans traceur tiers.
 *
 * Ne fait strictement rien sans le consentement « analytique » du bandeau
 * cookies (`xwegan_consent`) : pas d'identifiant, pas d'envoi. Avec
 * consentement : un UUID de visite (un an, localStorage), une ligne par page
 * vue, les clics marqués `data-suivi="libellé"`, et le temps passé (bilan à
 * la fermeture de la page). Ni IP ni user-agent ne sont collectés — le
 * serveur ne voit que ce qu'on lui envoie.
 */
const CLE_VISITE = "xwegan:visite";
const NOM_COOKIE_CONSENT = "xwegan_consent";

function consentementAnalytique(): boolean {
  try {
    const m = document.cookie.match(new RegExp(`${NOM_COOKIE_CONSENT}=([^;]+)`));
    if (!m) return false;
    return Boolean(JSON.parse(decodeURIComponent(m[1])).analytique);
  } catch {
    return false;
  }
}

function visiteId(): string {
  try {
    const existant = window.localStorage.getItem(CLE_VISITE);
    if (existant) return existant;
    const nouveau =
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : // Secours hexadécimal : le serveur n'accepte que [0-9a-f-].
          `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    window.localStorage.setItem(CLE_VISITE, nouveau);
    return nouveau;
  } catch {
    return "ephemere";
  }
}

function envoyer(corps: Record<string, unknown>) {
  try {
    const charge = JSON.stringify(corps);
    // `keepalive` survit à la fermeture de l'onglet pour le bilan de temps ;
    // le endpoint borne et valide tout, un visiteur hostile ne peut qu'ajouter
    // des lignes à son propre identifiant.
    void fetch("/api/audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: charge,
      keepalive: true,
    });
  } catch {
    // La mesure ne doit jamais casser la navigation.
  }
}

export function SuiviAudience() {
  const chemin = usePathname();

  useEffect(() => {
    if (!consentementAnalytique()) return;
    const visite = visiteId();
    const debut = Date.now();

    // Différé d'un tick : la mesure ne participe pas au rendu, le compilateur
    // React l'exige hors du flux synchrone de l'effet.
    const minuteur = setTimeout(() => envoyer({ visite, chemin, evenement: "page_vue" }), 0);

    const surClic = (e: MouseEvent) => {
      const cible = (e.target as HTMLElement).closest?.("[data-suivi]");
      if (!cible) return;
      const libelle = cible.getAttribute("data-suivi") ?? "";
      if (libelle) envoyer({ visite, chemin, evenement: "clic", detail: libelle.slice(0, 120) });
    };
    const auDepart = () => {
      envoyer({ visite, chemin, evenement: "temps", dureeMs: Date.now() - debut });
    };

    document.addEventListener("click", surClic);
    window.addEventListener("pagehide", auDepart);
    return () => {
      clearTimeout(minuteur);
      document.removeEventListener("click", surClic);
      window.removeEventListener("pagehide", auDepart);
    };
  }, [chemin]);

  return null;
}
