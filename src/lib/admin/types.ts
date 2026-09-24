/**
 * Types partagés du dashboard admin.
 *
 * Fichier volontairement sans `server-only` : les réponses des routes
 * /api/admin/* reprennent ces formes, et les composants clients les
 * consomment via TanStack Query.
 */
import type { PlanId } from "@/lib/plans";

export interface SeriePoint {
  periode: string;
  label: string;
  montant: number;
}

export interface SerieInscriptions {
  periode: string;
  label: string;
  nb: number;
}

export interface AlerteCompte {
  id: string;
  nom: string;
  email: string;
  detail: string;
}

export interface AdminOverview {
  totaux: {
    comptes: number;
    nouveauxJ7: number;
    nouveauxJ30: number;
    biens: number;
    lots: number;
    bauxActifs: number;
    locataires: number;
  };
  mrr: number;
  revenuMois: number;
  revenuMoisPrecedent: number;
  totalEncaisse: number;
  payants: number;
  conversion: number;
  repartition: Record<PlanId, number>;
  serieRevenus: SeriePoint[];
  serieInscriptions: SerieInscriptions[];
  funnel: { avecBien: number; avecBail: number; payants: number };
  alertes: {
    expire7j: AlerteCompte[];
    expiresRetombes: AlerteCompte[];
    quotaAtteints: AlerteCompte[];
    sansBien7j: AlerteCompte[];
  };
}

export type StatutCompte =
  | "payant"
  | "expire_bientot"
  | "expire"
  | "quota_atteint"
  | "essentiel";

export interface AdminCompte {
  id: string;
  nom: string;
  email: string;
  creeLe: string;
  planPaye: PlanId;
  planEffectif: PlanId;
  planExpireLe: string | null;
  nbBiens: number;
  nbBauxActifs: number;
  maxBaux: number | null;
  totalPaye: number;
  nbAbonnements: number;
  dernierPaiementLe: string | null;
  statut: StatutCompte;
  quota: "ok" | "proche" | "atteint";
}

export type StatutAbonnement = "actif" | "expire_bientot" | "expire";

export interface AdminAbonnement {
  id: string;
  creeLe: string;
  montantFcfa: number;
  periodeDebut: string;
  periodeFin: string;
  proprietaireId: string;
  proprietaireNom: string;
  proprietaireEmail: string;
  planSlug: PlanId;
  planNom: string;
  statut: StatutAbonnement;
  joursRestants: number;
  /** Geste commercial saisi à la main depuis /admin (montant 0, pas un paiement). */
  gesteAdmin: boolean;
}

export interface DetailLot {
  id: string;
  nom: string;
  composition: string;
  bail: {
    id: string;
    statut: "actif" | "termine";
    loyerMensuelFcfa: number;
    locataireNom: string;
  } | null;
}

export interface DetailBien {
  id: string;
  nom: string;
  ville: string;
  lots: DetailLot[];
}

export interface AdminCompteDetail {
  compte: AdminCompte;
  biens: DetailBien[];
  abonnements: AdminAbonnement[];
  nbLocataires: number;
  signalementsOuverts: number;
  /** Loyers confirmés transitant par ce parc (versements `confirme`). */
  gmvConfirmeFcfa: number;
}
