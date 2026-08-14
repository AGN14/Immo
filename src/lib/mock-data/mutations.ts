import { moisAPayer } from "@/lib/echeances";
import { baux } from "@/lib/mock-data/baux";
import {
  paiements,
  prochainNumeroQuittance,
  proprietaireDuBail,
  quittances,
  versements,
} from "@/lib/mock-data/reglements";
import { signalements } from "@/lib/mock-data/signalements";
import type {
  MethodePaiement,
  Signalement,
  StatutSignalement,
  UrgenceSignalement,
} from "@/lib/types";

/**
 * Écritures sur les données de démonstration.
 *
 * Ces mutations vivent en mémoire du serveur : elles disparaissent au
 * redémarrage. C'est assumé — elles existent pour que les parcours soient
 * réellement jouables avant qu'il y ait une base. Chaque fonction a le même
 * contour que la requête Supabase qui la remplacera, contrôles compris.
 */

let compteur = 0;
const nouvelId = (prefixe: string) => `${prefixe}-${Date.now().toString(36)}-${compteur++}`;

/* ------------------------------------------------------------- paiements */

export interface DeclarationPaiement {
  bailId: string;
  nombreMois: number;
  methode: MethodePaiement;
  reference?: string;
}

/**
 * Déclare un paiement couvrant N mois. Le locataire choisit un **nombre** de
 * mois, pas des mois précis : la résolution part des plus anciens impayés puis
 * avance dans le futur, ce qui évite de payer décembre en devant septembre.
 */
export function creerVersement(declaration: DeclarationPaiement) {
  const bail = baux.find((b) => b.id === declaration.bailId);
  if (!bail) return { erreur: "BAIL_INTROUVABLE" as const };
  if (bail.statut !== "actif") return { erreur: "BAIL_TERMINE" as const };

  const nombre = Math.trunc(declaration.nombreMois);
  if (!Number.isFinite(nombre) || nombre < 1 || nombre > 12) {
    return { erreur: "NOMBRE_INVALIDE" as const };
  }

  const mois = moisAPayer(bail, paiements, versements, nombre);
  if (mois.length === 0) return { erreur: "RIEN_A_PAYER" as const };

  const versementId = nouvelId("vers");
  versements.push({
    id: versementId,
    bailId: bail.id,
    montantTotalFcfa: bail.loyerMensuelFcfa * mois.length,
    methode: declaration.methode,
    referenceExterne: declaration.reference?.trim() || undefined,
    statut: "initie",
    declareLe: new Date().toISOString().slice(0, 10),
  });

  // Une ligne par mois : c'est ce qui permet une quittance mensuelle.
  for (const periode of mois) {
    paiements.push({
      id: nouvelId("pay"),
      bailId: bail.id,
      versementId,
      periode,
      montantFcfa: bail.loyerMensuelFcfa,
    });
  }

  return { versementId, mois, montantFcfa: bail.loyerMensuelFcfa * mois.length };
}

/**
 * Confirme un versement et émet les quittances des mois couverts.
 *
 * À l'étape 2, c'est le webhook PawaPay qui appellera ceci — seul
 * `confirmePar` changera.
 */
export function confirmerVersement(versementId: string, par: "proprietaire" | "operateur") {
  const versement = versements.find((v) => v.id === versementId);
  if (!versement) return { erreur: "INTROUVABLE" as const };
  if (versement.statut !== "initie") return { erreur: "DEJA_TRAITE" as const };

  versement.statut = "confirme";
  versement.confirmePar = par;
  versement.confirmeLe = new Date().toISOString().slice(0, 10);

  const proprietaireId = proprietaireDuBail(versement.bailId);
  const emises: string[] = [];

  for (const paiement of paiements.filter((p) => p.versementId === versementId)) {
    // Une quittance déjà émise ne se réémet pas.
    if (quittances.some((q) => q.paiementId === paiement.id && !q.annuleeLe)) continue;
    const numero = prochainNumeroQuittance(proprietaireId);
    quittances.push({
      id: nouvelId("q"),
      paiementId: paiement.id,
      proprietaireId,
      numero,
      emiseLe: versement.confirmeLe,
    });
    emises.push(numero);
  }

  return { emises };
}

/** Rejette une déclaration non retrouvée sur le relevé, et retire les mois
 *  qu'elle couvrait — ils redeviennent dus. */
export function rejeterVersement(versementId: string) {
  const versement = versements.find((v) => v.id === versementId);
  if (!versement) return { erreur: "INTROUVABLE" as const };
  if (versement.statut !== "initie") return { erreur: "DEJA_TRAITE" as const };

  versement.statut = "echoue";
  for (let i = paiements.length - 1; i >= 0; i--) {
    if (paiements[i].versementId === versementId) paiements.splice(i, 1);
  }
  return { ok: true as const };
}

/* ---------------------------------------------------------- signalements */

export interface NouveauSignalement {
  lotId: string;
  bailId?: string;
  titre: string;
  description: string;
  urgence: UrgenceSignalement;
}

export function creerSignalement(entree: NouveauSignalement) {
  const titre = entree.titre.trim();
  const description = entree.description.trim();
  if (titre.length < 3) return { erreur: "TITRE_TROP_COURT" as const };
  if (description.length < 10) return { erreur: "DESCRIPTION_TROP_COURTE" as const };

  const signalement: Signalement = {
    id: nouvelId("sig"),
    lotId: entree.lotId,
    bailId: entree.bailId,
    titre,
    description,
    urgence: entree.urgence,
    statut: "signale",
    creeLe: new Date().toISOString().slice(0, 10),
  };
  signalements.unshift(signalement);
  return { signalement };
}

/**
 * Transitions autorisées. « confirme » est réservé au locataire : sans son
 * accord, le propriétaire clôt seul et le désaccord devient un litige.
 */
const transitions: Record<StatutSignalement, StatutSignalement[]> = {
  signale: ["pris-en-charge", "annule"],
  "pris-en-charge": ["resolu", "annule"],
  resolu: ["confirme", "pris-en-charge"],
  confirme: [],
  annule: [],
};

export function changerStatutSignalement(signalementId: string, vers: StatutSignalement) {
  const signalement = signalements.find((s) => s.id === signalementId);
  if (!signalement) return { erreur: "INTROUVABLE" as const };
  if (!transitions[signalement.statut].includes(vers)) {
    return { erreur: "TRANSITION_INTERDITE" as const };
  }

  signalement.statut = vers;
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (vers === "pris-en-charge") signalement.resoluLe = undefined;
  if (vers === "resolu") signalement.resoluLe = aujourdhui;
  if (vers === "confirme") signalement.confirmeLe = aujourdhui;
  return { signalement };
}
