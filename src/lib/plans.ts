/**
 * Les paliers comptent les **baux actifs** — les logements effectivement loués.
 *
 * Ni les biens (un « bien » peut cacher un immeuble entier), ni les locataires
 * (ils ne paient jamais et ne comptent jamais), ni les lots vacants (le
 * propriétaire ne paie qu'à partir du moment où ça lui rapporte).
 */

export type PlanId = "essentiel" | "pro" | "business";

export interface Plan {
  id: PlanId;
  nom: string;
  prixFcfa: number;
  /** null = illimité */
  maxBaux: number | null;
}

export const PLANS: Record<PlanId, Plan> = {
  essentiel: { id: "essentiel", nom: "Essentiel", prixFcfa: 0, maxBaux: 3 },
  pro: { id: "pro", nom: "Pro", prixFcfa: 5000, maxBaux: 20 },
  business: { id: "business", nom: "Business", prixFcfa: 15000, maxBaux: null },
};

export const PLAN_PAR_DEFAUT: PlanId = "essentiel";

/**
 * Correspondance entre le palier applicatif et sa clé en base.
 *
 * Depuis la migration `plan_uuid`, `plan.id` est un UUID et l'ancien
 * identifiant vit dans `plan.slug`. Les UUID des trois paliers de base y sont
 * fixés en dur, précisément pour que le code puisse continuer à raisonner en
 * slugs — c'est l'intention de la migration, pas un contournement.
 *
 * Toute écriture vers `proprietaire.plan_id` doit passer par `uuidDuPlan`, et
 * toute lecture par `planDepuisUuid` : la colonne n'accepte plus « pro ».
 */
export const PLAN_UUID: Record<PlanId, string> = {
  essentiel: "1799276d-4950-4050-93a8-4e38c92a6320",
  pro: "d14214f0-466d-4665-961a-821b0d2d3a6d",
  business: "74900a30-67c8-4777-a896-7a8717833a6c",
};

export function uuidDuPlan(id: PlanId | undefined): string {
  return PLAN_UUID[id ?? PLAN_PAR_DEFAUT];
}

/** Le palier correspondant à un UUID de base. Un identifiant inconnu retombe
 *  sur le palier par défaut plutôt que de propager une valeur ininterprétable. */
export function planDepuisUuid(uuid: string | null | undefined): PlanId {
  const trouve = (Object.keys(PLAN_UUID) as PlanId[]).find((p) => PLAN_UUID[p] === uuid);
  return trouve ?? PLAN_PAR_DEFAUT;
}

/** Ordre hiérarchique des paliers : le plus haut débloque tout ce qui est
 *  en dessous de lui. */
const RANG: Record<PlanId, number> = { essentiel: 0, pro: 1, business: 2 };

/** Le palier actuel débloque-t-il une fonctionnalité réservée au palier
 *  requis ? (essentiel < pro < business) */
export function planSuffisant(actuel: PlanId | undefined, requis: PlanId): boolean {
  return RANG[actuel ?? PLAN_PAR_DEFAUT] >= RANG[requis];
}

export function getPlan(id: PlanId | undefined): Plan {
  return PLANS[id ?? PLAN_PAR_DEFAUT] ?? PLANS[PLAN_PAR_DEFAUT];
}

/** Le palier immédiatement supérieur, ou null si on est déjà au sommet. */
export function planSuivant(id: PlanId): Plan | null {
  if (id === "essentiel") return PLANS.pro;
  if (id === "pro") return PLANS.business;
  return null;
}

export type NiveauQuota = "ok" | "proche" | "atteint";

export interface Quota {
  plan: Plan;
  utilises: number;
  max: number | null;
  illimite: boolean;
  /** proche = 80 % ou plus, atteint = plus de place. */
  niveau: NiveauQuota;
  restants: number | null;
  suivant: Plan | null;
}

export function evaluerQuota(planId: PlanId | undefined, bauxActifs: number): Quota {
  const plan = getPlan(planId);
  const max = plan.maxBaux;

  if (max === null) {
    return {
      plan,
      utilises: bauxActifs,
      max: null,
      illimite: true,
      niveau: "ok",
      restants: null,
      suivant: null,
    };
  }

  const niveau: NiveauQuota =
    bauxActifs >= max ? "atteint" : bauxActifs / max >= 0.8 ? "proche" : "ok";

  return {
    plan,
    utilises: bauxActifs,
    max,
    illimite: false,
    niveau,
    restants: Math.max(0, max - bauxActifs),
    suivant: planSuivant(plan.id),
  };
}
