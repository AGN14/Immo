import { baux as tousLesBaux } from "@/lib/mock-data/baux";
import { biens as tousLesBiens, lots as tousLesLots } from "@/lib/mock-data/biens";
import { locataires as tousLesLocataires } from "@/lib/mock-data/locataires";

import { proprietaires } from "@/lib/mock-data/proprietaires";
import { signalements as tousLesSignalements } from "@/lib/mock-data/signalements";
import {
  paiements as tousLesPaiements,
  quittances as toutesLesQuittances,
  versements as tousLesVersements,
} from "@/lib/mock-data/reglements";
import { periodeDe, statutDuMois } from "@/lib/echeances";
import type { StatutLoyer } from "@/lib/types";

export { PROPRIETAIRE_DEMO } from "@/lib/mock-data/proprietaires";

/**
 * Couche d'accès aux données.
 *
 * Les tableaux bruts ne sont **pas** exportés : chaque lecture passe par une
 * fonction qui exige un identifiant — `proprietaireId` côté bailleur,
 * `locataireId` côté locataire — et filtre dessus. C'est ce qui évite qu'un
 * écran interroge le parc de tout le monde par inadvertance, et c'est
 * l'endroit exact où brancher Supabase sans toucher aux écrans.
 */

/** La période courante suit le calendrier : pas de constante à mettre à jour. */
export function periodeCourante() {
  return periodeDe(new Date());
}

/* ---------------------------------------------------------- propriétaires */

export function getProprietaireById(id: string) {
  return proprietaires.find((p) => p.id === id);
}

export function getProprietaireByEmail(email: string) {
  const normalise = email.trim().toLowerCase();
  return proprietaires.find((p) => p.email.toLowerCase() === normalise);
}

/**
 * Seules lectures volontairement non cloisonnées : à la connexion, on ne sait
 * pas encore de quel parc relève l'e-mail saisi. Réservées à l'authentification.
 */
export function getLocataireByEmail(email: string) {
  const normalise = email.trim().toLowerCase();
  return tousLesLocataires.find((l) => l.email.toLowerCase() === normalise);
}

/* --------------------------------------------- périmètre du propriétaire */

function perimetre(proprietaireId: string) {
  const biens = tousLesBiens.filter((b) => b.proprietaireId === proprietaireId);
  const bienIds = new Set(biens.map((b) => b.id));
  const lots = tousLesLots.filter((l) => bienIds.has(l.bienId));
  const lotIds = new Set(lots.map((l) => l.id));
  const baux = tousLesBaux.filter((b) => lotIds.has(b.lotId));
  const bailIds = new Set(baux.map((b) => b.id));
  return { biens, lots, lotIds, baux, bailIds };
}

export function getBiens(proprietaireId: string) {
  return perimetre(proprietaireId).biens;
}

export function getBienById(proprietaireId: string, id: string) {
  return perimetre(proprietaireId).biens.find((b) => b.id === id);
}

export function getLots(proprietaireId: string) {
  return perimetre(proprietaireId).lots;
}

export function getLotById(proprietaireId: string, id: string) {
  return perimetre(proprietaireId).lots.find((l) => l.id === id);
}

export function getLotsByBienId(proprietaireId: string, bienId: string) {
  return perimetre(proprietaireId).lots.filter((l) => l.bienId === bienId);
}

export function getLocataires(proprietaireId: string) {
  return tousLesLocataires.filter((l) => l.proprietaireId === proprietaireId);
}

export function getLocataireById(proprietaireId: string, id: string) {
  return tousLesLocataires.find((l) => l.id === id && l.proprietaireId === proprietaireId);
}

export function getBaux(proprietaireId: string) {
  return perimetre(proprietaireId).baux;
}

/** L'unité facturée : ni les biens, ni les lots, ni les locataires. */
export function getBauxActifs(proprietaireId: string) {
  return perimetre(proprietaireId).baux.filter((b) => b.statut === "actif");
}

export function getBauxTermines(proprietaireId: string) {
  return perimetre(proprietaireId).baux.filter((b) => b.statut === "termine");
}

export function getBailById(proprietaireId: string, id: string) {
  return perimetre(proprietaireId).baux.find((b) => b.id === id);
}

export function getBailActifByLotId(proprietaireId: string, lotId: string) {
  return perimetre(proprietaireId).baux.find((b) => b.lotId === lotId && b.statut === "actif");
}

export function getBauxByLotId(proprietaireId: string, lotId: string) {
  return perimetre(proprietaireId)
    .baux.filter((b) => b.lotId === lotId)
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

/* ------------------------------------------ versements et paiements (bailleur) */

export function getVersements(proprietaireId: string) {
  const { bailIds } = perimetre(proprietaireId);
  return tousLesVersements
    .filter((v) => bailIds.has(v.bailId))
    .sort((a, b) => b.declareLe.localeCompare(a.declareLe));
}

/** Les déclarations que le propriétaire doit encore pointer. */
export function getVersementsAConfirmer(proprietaireId: string) {
  return getVersements(proprietaireId).filter((v) => v.statut === "initie");
}

export function getPaiements(proprietaireId: string) {
  const { bailIds } = perimetre(proprietaireId);
  return tousLesPaiements.filter((p) => bailIds.has(p.bailId));
}

export function getPaiementsByBailId(proprietaireId: string, bailId: string) {
  const { bailIds } = perimetre(proprietaireId);
  if (!bailIds.has(bailId)) return [];
  return tousLesPaiements
    .filter((p) => p.bailId === bailId)
    .sort((a, b) => b.periode.localeCompare(a.periode));
}

export function getPaiementsPeriodeCourante(proprietaireId: string) {
  const periode = periodeCourante();
  return getPaiements(proprietaireId).filter((p) => p.periode === periode);
}

export function getVersementById(proprietaireId: string, id: string) {
  return getVersements(proprietaireId).find((v) => v.id === id);
}

/** Le versement d'un paiement — porte la méthode, la référence et le statut. */
export function versementDuPaiement(versementId: string) {
  return tousLesVersements.find((v) => v.id === versementId);
}

export function getQuittanceDuPaiement(paiementId: string) {
  return toutesLesQuittances.find((q) => q.paiementId === paiementId && !q.annuleeLe);
}

/* --------------------------------------------------- statut d'un mois */

export function statutLoyerDuBail(proprietaireId: string, bailId: string): StatutLoyer {
  const bail = getBailById(proprietaireId, bailId);
  const proprietaire = getProprietaireById(proprietaireId);
  if (!bail || !proprietaire) return "en-attente";
  return statutDuMois(periodeCourante(), bail, proprietaire, tousLesPaiements, tousLesVersements);
}

/* -------------------------------------------------------- signalements */

export function getSignalements(proprietaireId: string) {
  const { lotIds } = perimetre(proprietaireId);
  return tousLesSignalements
    .filter((s) => lotIds.has(s.lotId))
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

export function getSignalementsOuverts(proprietaireId: string) {
  return getSignalements(proprietaireId).filter(
    (s) => s.statut === "signale" || s.statut === "pris-en-charge",
  );
}

export function getSignalementsByLotId(proprietaireId: string, lotId: string) {
  return getSignalements(proprietaireId).filter((s) => s.lotId === lotId);
}

/* ============================================ périmètre du locataire ==== */

/**
 * Pendant exact du périmètre propriétaire. Un locataire ne voit que ses propres
 * baux, et rien d'autre — même en tapant une URL à la main.
 */
function perimetreLocataire(locataireId: string) {
  const baux = tousLesBaux.filter((b) => b.locataireId === locataireId);
  const bailIds = new Set(baux.map((b) => b.id));
  return { baux, bailIds };
}

export function getLocataireParId(locataireId: string) {
  return tousLesLocataires.find((l) => l.id === locataireId);
}

/** Le bail en cours du locataire. Absent s'il est sorti. */
export function getBailDuLocataire(locataireId: string) {
  return perimetreLocataire(locataireId).baux.find((b) => b.statut === "actif");
}

export function getBauxDuLocataire(locataireId: string) {
  return perimetreLocataire(locataireId).baux.sort((a, b) =>
    b.dateDebut.localeCompare(a.dateDebut),
  );
}

/** Le logement occupé, avec son bien — sans jamais exposer le reste du parc. */
export function getLogementDuLocataire(locataireId: string) {
  const bail = getBailDuLocataire(locataireId);
  if (!bail) return undefined;
  const lot = tousLesLots.find((l) => l.id === bail.lotId);
  const bien = lot ? tousLesBiens.find((b) => b.id === lot.bienId) : undefined;
  const proprietaire = bien ? getProprietaireById(bien.proprietaireId) : undefined;
  return { bail, lot, bien, proprietaire };
}

export function getPaiementsDuLocataire(locataireId: string) {
  const { bailIds } = perimetreLocataire(locataireId);
  return tousLesPaiements
    .filter((p) => bailIds.has(p.bailId))
    .sort((a, b) => b.periode.localeCompare(a.periode));
}

export function getVersementsDuLocataire(locataireId: string) {
  const { bailIds } = perimetreLocataire(locataireId);
  return tousLesVersements
    .filter((v) => bailIds.has(v.bailId))
    .sort((a, b) => b.declareLe.localeCompare(a.declareLe));
}

export function getQuittancesDuLocataire(locataireId: string) {
  const paiementIds = new Set(getPaiementsDuLocataire(locataireId).map((p) => p.id));
  return toutesLesQuittances.filter((q) => paiementIds.has(q.paiementId) && !q.annuleeLe);
}

export function getSignalementsDuLocataire(locataireId: string) {
  const { bailIds } = perimetreLocataire(locataireId);
  return tousLesSignalements
    .filter((s) => s.bailId !== undefined && bailIds.has(s.bailId))
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

/** Les paiements et versements bruts, pour les calculs d'échéance. */
export function donneesEcheance() {
  return { paiements: tousLesPaiements, versements: tousLesVersements };
}

/* --------------------------------------------------------------- dashboard */

export function getDashboardKpis(proprietaireId: string) {
  const paiementsMois = getPaiementsPeriodeCourante(proprietaireId);
  const confirme = (versementId: string) => versementDuPaiement(versementId)?.statut === "confirme";

  const totalRecuFcfa = paiementsMois
    .filter((p) => confirme(p.versementId))
    .reduce((sum, p) => sum + p.montantFcfa, 0);

  const bauxActifs = getBauxActifs(proprietaireId);
  const attendu = bauxActifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);

  const { lots, biens } = perimetre(proprietaireId);

  return {
    totalRecuFcfa,
    totalEnAttenteFcfa: Math.max(0, attendu - totalRecuFcfa),
    lotsLoues: bauxActifs.length,
    lotsTotal: lots.length,
    tauxOccupation: lots.length ? Math.round((bauxActifs.length / lots.length) * 100) : 0,
    biensTotal: biens.length,
    signalementsOuverts: getSignalementsOuverts(proprietaireId).length,
  };
}
