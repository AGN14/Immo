"use server";

import { revalidatePath } from "next/cache";
import { requireLocataire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getLocataireById,
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { moisAPayer, penaliteDuMois } from "@/lib/echeances";
import {
  creerPaiement,
  estReferenceGeniusPay,
  originePaiement,
  recupererPaiement,
  verifierTransaction,
} from "@/lib/paiement/geniuspay";
import type { EtatAction } from "@/lib/actions/biens";

/**
 * Encaissement d'un loyer en ligne, en deux temps.
 *
 * GeniusPay n'a pas de widget : le serveur crée le paiement, le navigateur
 * part sur la page de checkout, puis revient sur `/payer/confirmation`.
 *
 * 1. `initierPaiementLoyerEnLigne(mois)` — recalcule le dû (jamais cru depuis
 *    le navigateur), crée le paiement GeniusPay, fige un versement `initie`
 *    portant la référence `MTX-...`, et rend l'URL de checkout.
 * 2. `confirmerPaiementLoyerEnLigne()` — au retour, relit le versement en
 *    attente, vérifie la transaction auprès de GeniusPay, et seulement alors
 *    solde les mois et émet les quittances.
 *
 * Le versement naît `confirme`, avec `confirme_par = 'operateur'` : le
 * propriétaire n'a rien à pointer — le modèle prévoyait ce cas depuis le
 * début. Un versement en attente abandonné reste `initie`, comme une
 * déclaration manuelle jamais confirmée ; un retour en échec le bascule en
 * `echoue` pour qu'il ne pollue pas la liste à confirmer du propriétaire.
 */

interface DuLocataire {
  bailId: string;
  loyerMensuelFcfa: number;
  mois: string[];
  penalites: number[];
  attenduFcfa: number;
  penalitesFcfa: number;
  telephone: string;
  nom: string;
}

/** Ce qui est dû, recalculé ici — jamais reçu du navigateur. */
async function calculerDu(
  locataireId: string,
  moisChoisis: string[],
): Promise<{ ok: true; du: DuLocataire; bailId: string } | { ok: false; erreur: string }> {
  const logement = await getLogementDuLocataire(locataireId);
  const bail = logement?.bail;
  const proprietaire = logement?.proprietaire;
  if (!bail || !proprietaire) return { ok: false, erreur: "Aucun bail en cours." };

  const mois = [...new Set(moisChoisis)].sort();
  if (mois.length === 0) return { ok: false, erreur: "Aucun mois à régler." };
  if (mois.some((m) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(m))) {
    return { ok: false, erreur: "Période invalide." };
  }

  // Les mois sont revalidés contre le bail : on ne règle pas un mois déjà
  // couvert, ni un mois qui n'est pas encore dû.
  const [paiements, versements] = await Promise.all([
    getPaiementsDuLocataire(locataireId),
    getVersementsDuLocataire(locataireId),
  ]);
  const dus = new Set(moisAPayer(bail, paiements, versements, mois.length));
  if (mois.some((m) => !dus.has(m))) {
    return { ok: false, erreur: "Certains mois ne sont pas dus sur votre bail." };
  }

  const penalites = mois.map((m) => penaliteDuMois(m, bail, proprietaire));
  const penalitesFcfa = penalites.reduce((s, p) => s + p, 0);
  const locataire = await getLocataireById(proprietaire.id, locataireId);

  return {
    ok: true,
    du: {
      bailId: bail.id,
      loyerMensuelFcfa: bail.loyerMensuelFcfa,
      mois,
      penalites,
      attenduFcfa: mois.length * bail.loyerMensuelFcfa + penalitesFcfa,
      penalitesFcfa,
      telephone: locataire?.telephone ?? "",
      nom: locataire?.nom ?? "",
    },
    bailId: bail.id,
  };
}

/** Les versements en attente initiés en ligne : reconnaissables à leur
 *  référence GeniusPay, pour ne jamais toucher aux déclarations manuelles. */

export async function initierPaiementLoyerEnLigne(
  moisChoisis: string[],
): Promise<{ ok: boolean; checkoutUrl?: string; erreur?: string }> {
  const { locataireId } = await requireLocataire();
  const calcule = await calculerDu(locataireId, moisChoisis);
  if (!calcule.ok) return { ok: false, erreur: calcule.erreur };
  const { du, bailId } = calcule;

  const sb = supabaseServer();

  // Un seul paiement en ligne en attente par bail : le précédent, abandonné,
  // est annulé pour ne pas encombrer la liste à confirmer du propriétaire.
  // Filtrage en JS sur les deux préfixes (`MTX-`, `SANDBOX_MT`) : un LIKE SQL
  // exigerait d'échapper le `_` de `SANDBOX_MT`, devenu joker. Périmètre
  // explicite sur le bail : la clé de service contourne RLS, sans cette
  // clause on annulerait les paiements de tout le monde.
  const { data: precedents } = await sb
    .from("versement")
    .select("id, reference_externe")
    .eq("bail_id", bailId)
    .eq("statut", "initie");
  const aAnnuler = (precedents ?? [])
    .filter((v) => estReferenceGeniusPay(v.reference_externe ?? undefined))
    .map((v) => v.id);
  if (aAnnuler.length > 0) {
    await sb.from("versement").update({ statut: "annule" }).in("id", aAnnuler);
  }

  const origine = await originePaiement();
  const creation = await creerPaiement({
    montantFcfa: du.attenduFcfa,
    description: `Loyer ${du.mois.join(", ")}`.slice(0, 500),
    client: {
      ...(du.nom ? { nom: du.nom } : {}),
      ...(du.telephone ? { telephone: du.telephone } : {}),
    },
    // Les mois voyagent dans les metadata : au retour, on les relit depuis
    // GeniusPay, pas depuis l'URL — l'URL, elle, ne porte rien de confiance.
    metadata: { contexte: "loyer", bail_id: bailId, mois: du.mois.join(",") },
    successUrl: `${origine}/payer/confirmation`,
    errorUrl: `${origine}/payer/confirmation`,
  });
  if (!creation.ok || !creation.reference || !creation.checkoutUrl) {
    return { ok: false, erreur: creation.erreur ?? "Paiement non initié." };
  }

  const { error } = await sb.from("versement").insert({
    bail_id: bailId,
    montant_total_fcfa: du.attenduFcfa,
    penalites_fcfa: du.penalitesFcfa,
    methode: "mobile-money",
    reference_externe: creation.reference,
    statut: "initie",
  });
  if (error) return { ok: false, erreur: "Paiement initié, mais suivi impossible. Réessayez." };

  return { ok: true, checkoutUrl: creation.checkoutUrl };
}

/** Les mois d'un versement confirmé + leurs quittances. Extrait tel quel de
 *  l'ancien encaissement direct : la règle n'a pas changé, seul le moment où
 *  l'argent est vérifié a bougé. */
async function solderMois(
  sb: ReturnType<typeof supabaseServer>,
  bailId: string,
  proprietaireId: string,
  versementId: string,
  loyerMensuelFcfa: number,
  mois: string[],
  penalites: number[],
): Promise<boolean> {
  const { error: erreurPaiements } = await sb.from("paiement").insert(
    mois.map((periode, i) => ({
      bail_id: bailId,
      versement_id: versementId,
      periode,
      montant_fcfa: loyerMensuelFcfa,
      penalite_fcfa: penalites[i],
    })),
  );
  if (erreurPaiements) return false;

  const { data: lignes } = await sb.from("paiement").select("id").eq("versement_id", versementId);
  for (const ligne of lignes ?? []) {
    const { data: numero } = await sb.rpc("prochain_numero_quittance", {
      p_proprietaire_id: proprietaireId,
    });
    if (!numero) continue;
    await sb.from("quittance").insert({
      paiement_id: ligne.id,
      proprietaire_id: proprietaireId,
      numero,
    });
  }
  return true;
}

export type EtatConfirmation = EtatAction & { statut?: string };

/**
 * Au retour du checkout : vérifie le versement en attente et le solde.
 *
 * Rejouable sans danger (rechargement de page) : un versement déjà confirmé
 * rend `ok: true` aussitôt. Un paiement non abouti bascule en `echoue` pour
 * disparaître de la liste à confirmer du propriétaire.
 */
export async function confirmerPaiementLoyerEnLigne(): Promise<EtatConfirmation> {
  const { locataireId } = await requireLocataire();
  const sb = supabaseServer();

  const versements = await getVersementsDuLocataire(locataireId);
  const enAttente = versements.find(
    (v) => v.statut === "initie" && estReferenceGeniusPay(v.referenceExterne),
  );
  if (!enAttente || !enAttente.referenceExterne) {
    return { ok: false, erreur: "Aucun paiement en cours à confirmer." };
  }

  const transaction = await verifierTransaction(enAttente.referenceExterne);
  if (!transaction.valide) {
    // Échec ou abandon : on l'enregistre comme tel plutôt que de laisser un
    // faux « à confirmer » au propriétaire.
    if (transaction.statut === "failed" || transaction.statut === "expired") {
      await sb.from("versement").update({ statut: "echoue" }).eq("id", enAttente.id);
    }
    return { ok: false, erreur: "Paiement non confirmé par l'opérateur.", statut: transaction.statut };
  }

  const logement = await getLogementDuLocataire(locataireId);
  const bail = logement?.bail;
  const proprietaire = logement?.proprietaire;
  if (!bail || !proprietaire || bail.id !== enAttente.bailId) {
    return { ok: false, erreur: "Bail introuvable pour ce paiement." };
  }

  // Les mois couverts sont relus depuis GeniusPay (metadata), pas depuis le
  // navigateur : une URL de confirmation forgée ne fait rien passer.
  const paiement = await recupererPaiement(enAttente.referenceExterne);
  const mois = String(paiement.metadata.mois ?? "")
    .split(",")
    .filter((m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m));
  if (mois.length === 0) return { ok: false, erreur: "Paiement sans mois rattachés." };

  const recalcule = await calculerDu(locataireId, mois);
  if (!recalcule.ok) return { ok: false, erreur: recalcule.erreur };
  if (transaction.montantFcfa < recalcule.du.attenduFcfa) {
    return {
      ok: false,
      erreur: `Montant encaissé insuffisant : ${transaction.montantFcfa.toLocaleString("fr-FR")} F pour ${recalcule.du.attenduFcfa.toLocaleString("fr-FR")} F attendus.`,
    };
  }

  const { error: erreurFlip } = await sb
    .from("versement")
    .update({
      montant_total_fcfa: recalcule.du.attenduFcfa,
      penalites_fcfa: recalcule.du.penalitesFcfa,
      statut: "confirme",
      confirme_par: "operateur",
      confirme_le: new Date().toISOString(),
    })
    .eq("id", enAttente.id)
    .eq("statut", "initie");

  if (erreurFlip) {
    // Déjà confirmé entre-temps (double retour) : tout est en place.
    const relu = (await getVersementsDuLocataire(locataireId)).find((v) => v.id === enAttente.id);
    if (relu?.statut === "confirme") return { ok: true };
    return { ok: false, erreur: "Enregistrement du paiement impossible." };
  }

  const solde = await solderMois(
    sb,
    bail.id,
    proprietaire.id,
    enAttente.id,
    recalcule.du.loyerMensuelFcfa,
    recalcule.du.mois,
    recalcule.du.penalites,
  );
  if (!solde) return { ok: false, erreur: "Enregistrement des mois impossible." };

  revalidatePath("/dashboard");
  revalidatePath("/payer");
  revalidatePath("/historique");
  return { ok: true };
}
