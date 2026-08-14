/**
 * Bien → Lot → Bail → Locataire.
 *
 * Le bail est la pièce centrale : c'est lui qui porte le loyer et les dates,
 * et c'est le nombre de baux **actifs** qui détermine le palier tarifaire.
 * Un lot vacant ne compte pas, un bail terminé non plus.
 *
 * v1 : un seul locataire par bail (pas de colocation).
 */

import type { PlanId } from "@/lib/plans";

/**
 * Le propriétaire est la racine du cloisonnement : toute requête est filtrée
 * par son identifiant. Rien ne doit pouvoir être lu sans passer par lui.
 */
export interface Proprietaire {
  id: string;
  nom: string;
  email: string;
  plan: PlanId;
  /** Jour du mois où le loyer est dû. Surchargeable par bail. */
  jourEcheanceDefaut: number;
  /** Jour où Immo reverse les loyers collectés. Défini par le propriétaire. */
  jourReversement: number;
  /** Date d'ouverture du compte. */
  creeLe: string;
  /** Un mot de passe est exigé pour confirmer les modifications sensibles. */
  aMotDePasse: boolean;
}

export type TypeBien = "immeuble" | "residence" | "concession" | "villa" | "maison";

/**
 * Vocabulaire du marché ouest-africain. À partir de trois chambres on parle
 * d'appartement : il n'y a donc pas de palier « 3 chambres salon ».
 */
export type CompositionLot =
  | "entrer-coucher"
  | "chambre-salon"
  | "2-chambres-salon"
  | "studio"
  | "appartement"
  | "villa"
  | "boutique";
export type StatutBail = "actif" | "termine";
export type MethodePaiement = "mobile-money" | "virement" | "especes";
export type StatutVersement = "initie" | "confirme" | "echoue" | "annule";

/**
 * Statut d'un mois de loyer. Jamais stocké : il se déduit de l'existence d'un
 * paiement, de l'état de son versement et de la date d'échéance. Un statut
 * stocké exigerait une tâche nocturne qui se désynchronise au premier incident.
 */
export type StatutLoyer = "a-jour" | "declare" | "en-attente" | "en-retard";

/** Une adresse : un immeuble, une résidence, une villa. */
export interface Bien {
  id: string;
  proprietaireId: string;
  nom: string;
  type: TypeBien;
  adresse: string;
  quartier: string;
  ville: string;
  dateAjout: string;
  /** Présentation libre, affichée sur la fiche du bien. */
  description: string | null;
  /** URL d'une photo (hébergée ailleurs) affichée sur la carte et la fiche. */
  imageUrl: string | null;
  garage: boolean;
  balcon: boolean;
  ascenseur: boolean;
  climatisation: boolean;
  /** Superficie en m², renseignée par le propriétaire. */
  superficieM2: number | null;
  /** Nombre d'étages — pertinent pour un immeuble ou une résidence. */
  etages: number | null;
}

/** Une unité louable à l'intérieur d'un bien. Une villa n'a qu'un seul lot. */
export interface Lot {
  id: string;
  bienId: string;
  nom: string;
  composition: CompositionLot;
  /**
   * Ce que le logement vaut, qu'il soit occupé ou non. À distinguer du loyer
   * du bail, qui est ce que **ce locataire-là** paie réellement : l'écart
   * entre les deux signale un bail à réviser.
   * Absent tant que le propriétaire n'a pas fixé son prix.
   */
  loyerReferenceFcfa?: number;
}

/** La relation locative. C'est l'objet compté par le quota du palier. */
export interface Bail {
  id: string;
  lotId: string;
  locataireId: string;
  loyerMensuelFcfa: number;
  dateDebut: string;
  /** Absente tant que le bail court. */
  dateFin?: string;
  statut: StatutBail;
  /** Jour d'échéance négocié sur ce bail. Absent = règle du propriétaire. */
  jourEcheance?: number;
}

export type UrgenceSignalement = "basse" | "normale" | "haute";
export type StatutSignalement = "signale" | "pris-en-charge" | "resolu" | "confirme" | "annule";

/**
 * Rattaché au lot, pas au bail : une fuite est un fait du logement et reste
 * visible quand le locataire change. `bailId` retient qui l'a signalée.
 */
export interface Signalement {
  id: string;
  lotId: string;
  bailId?: string;
  titre: string;
  description: string;
  urgence: UrgenceSignalement;
  statut: StatutSignalement;
  creeLe: string;
  resoluLe?: string;
  confirmeLe?: string;
}

/** Pièce d'identité retenue pour le suivi du locataire. */
export type PieceIdentite = "cni" | "passeport" | "permis" | "carte-sejour" | "autre";

/** Les coordonnées d'un locataire ne doivent jamais franchir la frontière
 *  d'un propriétaire : elles portent donc aussi son identifiant. */
export interface Locataire {
  id: string;
  proprietaireId: string;
  nom: string;
  telephone: string;
  email: string;
  /** Avatar, uploadé dans le stockage Immo. */
  photoUrl: string | null;
  /** Date de naissance, au format AAAA-MM-JJ. */
  dateNaissance: string | null;
  pieceType: PieceIdentite | null;
  pieceNumero: string | null;
  profession: string | null;
  /** Nombre de personnes vivant dans le logement. */
  occupants: number | null;
  /** Personne de confiance à joindre en cas d'impayé. */
  garantNom: string | null;
  garantTelephone: string | null;
}

/**
 * Un acte de paiement. Il peut couvrir plusieurs mois : avec Mobile Money, la
 * confirmation porte sur la transaction, pas sur chaque mois — si l'opérateur
 * confirme, tous les mois basculent ensemble.
 */
export interface Versement {
  id: string;
  bailId: string;
  montantTotalFcfa: number;
  methode: MethodePaiement;
  referenceExterne?: string;
  statut: StatutVersement;
  /** Étape 1 : le propriétaire. Étape 2 (PawaPay) : l'opérateur. */
  confirmePar?: "proprietaire" | "operateur";
  declareLe: string;
  confirmeLe?: string;
}

/**
 * Un mois couvert par un versement. Une ligne par mois, parce qu'une quittance
 * est mensuelle. Un mois non payé n'a tout simplement pas de ligne.
 */
export interface Paiement {
  id: string;
  bailId: string;
  versementId: string;
  periode: string;
  montantFcfa: number;
}

/** Émise dès la confirmation de l'encaissement, jamais modifiée. */
export interface Quittance {
  id: string;
  paiementId: string;
  proprietaireId: string;
  numero: string;
  emiseLe: string;
  annuleeLe?: string;
}
