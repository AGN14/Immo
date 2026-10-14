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
  /** Restriction modérateur : banni de la session et de RLS, données intactes. */
  suspendu: boolean;
  suspenduLe: string | null;
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

/** Ligne de l'historique marchand GeniusPay, pour réconcilier les loyers et
 *  abonnements encaissés en ligne avec ce que l'opérateur a vraiment vu. */
export interface AdminTransaction {
  reference: string;
  statut: string;
  montantFcfa: number;
  methode: string | null;
  creeLe: string;
}

export interface AdminTransactionsReponse {
  transactions: AdminTransaction[];
  /** Résultat du diagnostic des clés (« clés acceptées… » ou la raison). */
  diagnostic: string;
  bacASable: boolean;
}

/** Ligne du journal d'audit : un geste manuel, son auteur, sa cible. */
export interface AdminEvenement {
  id: string;
  creeLe: string;
  acteurEmail: string;
  action:
    | "plan_change"
    | "prolongation"
    | "moderation_statut"
    | "moderation_urgence"
    | "suspension"
    | "reintegration";
  proprietaireEmail: string;
  resume: string;
}

export interface PhotoDossier {
  url: string;
  titre: string;
  date: string;
}

export interface LotDossier {
  id: string;
  nom: string;
  photos: PhotoDossier[];
  locataireNom: string | null;
  locatairePhotoUrl: string | null;
}

export interface BienDossier {
  id: string;
  nom: string;
  ville: string;
  imageUrl: string | null;
  lots: LotDossier[];
}

export interface AdminDossier {
  biens: BienDossier[];
  totalPhotos: number;
}

export interface MessageSignalement {
  auteur: string;
  corps: string;
  creeLe: string;
}

export interface AdminSignalement {
  id: string;
  titre: string;
  description: string;
  urgence: string;
  statut: string;
  creeLe: string;
  resoluLe: string | null;
  photos: string[];
  messages: MessageSignalement[];
  lotNom: string;
  bienNom: string;
  ville: string;
  bailId: string | null;
  proprietaireId: string;
  proprietaireNom: string;
  proprietaireEmail: string;
  locataireNom: string;
  locataireTelephone: string;
}

export interface AdminSignalementListe {
  id: string;
  titre: string;
  ville: string;
  urgence: string;
  statut: string;
  creeLe: string;
}

export interface AdminRecherche {
  comptes: { id: string; nom: string; email: string }[];
  biens: { id: string; nom: string; ville: string; proprietaireId: string; proprietaireEmail: string }[];
  signalements: { id: string; titre: string; statut: string; urgence: string }[];
}

export interface VilleParc {
  ville: string;
  nbBiens: number;
}

export interface VersementEnAttente {
  id: string;
  proprietaireEmail: string;
  montantFcfa: number;
  depuisLe: string;
  enLigne: boolean;
}

export interface SignalementParc {
  id: string;
  titre: string;
  urgence: string;
  ville: string;
  creeLe: string;
}

export interface AdminParc {
  biens: number;
  lots: number;
  bauxActifs: number;
  tauxOccupation: number;
  villes: VilleParc[];
  enAttente: VersementEnAttente[];
  totalEnAttenteFcfa: number;
  signalementsOuverts: number;
  signalementsParUrgence: Record<string, number>;
  signalementsRecents: SignalementParc[];
}

export interface AdminSysteme {
  supabaseLatenceMs: number | null;
  comptes: number;
  abonnements: number;
  geniuspayDiagnostic: string;
  geniuspayBacASable: boolean;
  deploiement: { commit: string; environnement: string; hoteAdmin: string };
  plansOk: boolean;
  plansEcarts: { slug: string; champ: string; base: string; code: string }[];
}

export interface JourAudience {
  periode: string;
  label: string;
  visiteurs: number;
  pagesVues: number;
  inscriptions: number;
}

export interface RelanceAbonnement {
  id: string;
  nom: string;
  email: string;
  plan: string;
  expireLe: string;
  joursRestants: number;
}

export interface AdminAudience {
  visiteursUniques14j: number;
  pagesVues14j: number;
  tempsMoyenSecondes: number | null;
  serie: JourAudience[];
  pagesTop: { chemin: string; nb: number }[];
  clicsTop: { label: string; nb: number }[];
  newsletterTotal: number;
  newsletterActifs: number;
  newsletterRecents: { email: string; creeLe: string }[];
  relances: RelanceAbonnement[];
}

export interface AdminReversement {
  id: string;
  periode: string;
  proprietaireEmail: string;
  brutFcfa: number;
  netFcfa: number;
  prevuLe: string;
  executeLe: string | null;
  statut: string;
  enRetard: boolean;
}

export interface AdminReversements {
  reversements: AdminReversement[];
  totalNetFcfa: number;
  enRetard: number;
  echoues: number;
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
