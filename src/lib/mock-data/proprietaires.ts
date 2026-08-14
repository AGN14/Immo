import type { Proprietaire } from "@/lib/types";

/**
 * Deux propriétaires, volontairement : avec un seul, le cloisonnement des
 * données ne serait pas vérifiable. Thierry est à la limite de son palier
 * Essentiel, Awa est sur Pro — chacun ne doit jamais voir le parc de l'autre.
 */
export const proprietaires: Proprietaire[] = [
  {
    id: "prop-thierry",
    nom: "Thierry Yerima",
    email: "thierry@immo.app",
    plan: "essentiel",
    jourEcheanceDefaut: 5,
    penaliteRetardFcfa: 5000,
    delaiToleranceJours: 5,
    jourReversement: 1,
  },
  {
    id: "prop-awa",
    nom: "Awa Traoré",
    email: "awa.traore@example.com",
    plan: "pro",
    jourEcheanceDefaut: 5,
    penaliteRetardFcfa: 5000,
    delaiToleranceJours: 5,
    jourReversement: 3,
  },
];

/** Le parc rattaché à toute connexion dont l'e-mail est inconnu, le temps
 *  qu'il y ait une vraie base d'utilisateurs. */
export const PROPRIETAIRE_DEMO = "prop-thierry";
