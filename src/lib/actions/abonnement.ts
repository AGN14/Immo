"use server";

import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";
import {
  creerPaiement,
  listerPaiements,
  originePaiement,
  verifierTransaction,
} from "@/lib/paiement/geniuspay";
import type { EtatAction } from "@/lib/actions/biens";

/** Un mois d'abonnement. Payé d'avance, sans reconduction automatique. */
const DUREE_JOURS = 30;

/**
 * Crée le paiement GeniusPay d'un palier et rend l'URL de checkout.
 *
 * Le prix est relu depuis `PLANS`, jamais reçu du client — sans quoi on
 * s'offrirait Business pour un franc. Le plan voyage dans l'URL de retour
 * (connu avant la création) et dans les metadata ; la référence, elle, est
 * retrouvée au retour par recherche du dernier paiement non consommé.
 */
export async function initierAbonnementEnLigne(
  plan: PlanId,
): Promise<{ ok: boolean; checkoutUrl?: string; erreur?: string }> {
  const session = await requireProprietaire();

  const palier = PLANS[plan];
  if (!palier) return { ok: false, erreur: "Palier inconnu." };
  if (palier.prixFcfa <= 0) {
    return { ok: false, erreur: "Ce palier est gratuit : aucun paiement n'est attendu." };
  }

  const origine = await originePaiement();
  const creation = await creerPaiement({
    montantFcfa: palier.prixFcfa,
    description: `Abonnement ${palier.nom} — 30 jours`.slice(0, 500),
    client: { nom: session.nom, email: session.email },
    metadata: { contexte: "abonnement", proprietaire_id: session.proprietaireId, plan },
    successUrl: `${origine}/plans/confirmation?plan=${plan}`,
    errorUrl: `${origine}/plans/confirmation?plan=${plan}`,
  });
  if (!creation.ok || !creation.checkoutUrl) {
    return { ok: false, erreur: creation.erreur ?? "Paiement non initié." };
  }
  return { ok: true, checkoutUrl: creation.checkoutUrl };
}

/**
 * Retrouve au retour du checkout le paiement à enregistrer.
 *
 * La référence n'est ni dans l'URL ni crue depuis le navigateur : on reprend
 * les derniers paiements `completed` au nom du propriétaire et on retient le
 * plus récent dont la référence n'a encore prolongé aucun abonnement, d'un
 * montant suffisant et de moins de deux heures. Un rejeu de l'URL ne trouve
 * rien à consommer deux fois.
 */
export async function retrouverPaiementAbonnement(
  plan: PlanId,
): Promise<{ ok: boolean; reference?: string; erreur?: string }> {
  const session = await requireProprietaire();
  const palier = PLANS[plan];
  if (!palier || palier.prixFcfa <= 0) return { ok: false, erreur: "Palier inconnu." };

  const sb = supabaseServer();
  const { data: consommes } = await sb
    .from("abonnement")
    .select("reference_externe")
    .eq("proprietaire_id", session.proprietaireId);
  const dejaVues = new Set((consommes ?? []).map((a) => a.reference_externe));

  const deuxHeures = Date.now() - 2 * 60 * 60 * 1000;
  const candidats = await listerPaiements({
    statut: "completed",
    recherche: session.email,
    parPage: 20,
  });
  const paiement = candidats.find(
    (p) =>
      !dejaVues.has(p.reference) &&
      p.montantFcfa >= palier.prixFcfa &&
      (!p.creeLe || new Date(p.creeLe).getTime() >= deuxHeures),
  );
  if (!paiement) return { ok: false, erreur: "Aucun paiement abouti à enregistrer." };
  return { ok: true, reference: paiement.reference };
}

/**
 * Souscription à un palier payant.
 *
 * Mêmes précautions que pour les loyers, et pour la même raison : le
 * navigateur ne transmet qu'un identifiant de transaction. Le prix est relu
 * depuis `PLANS`, jamais reçu du client — sans quoi on s'offrirait Business
 * pour un franc.
 *
 * La période part de maintenant, même si le palier précédent courait encore.
 * C'est le choix « plein tarif, nouvelle période » : simple à comprendre,
 * légèrement défavorable à qui change en cours de mois.
 */
export async function souscrireAbonnement(
  transactionId: string,
  plan: PlanId,
): Promise<EtatAction> {
  const session = await requireProprietaire();

  const palier = PLANS[plan];
  if (!palier) return { ok: false, erreur: "Palier inconnu." };
  if (palier.prixFcfa <= 0) {
    return { ok: false, erreur: "Ce palier est gratuit : aucun paiement n'est attendu." };
  }

  const transaction = await verifierTransaction(transactionId);
  if (!transaction.valide) {
    return { ok: false, erreur: "Paiement non confirmé par l'opérateur." };
  }
  if (transaction.montantFcfa < palier.prixFcfa) {
    return {
      ok: false,
      erreur: `Montant insuffisant : ${transaction.montantFcfa.toLocaleString("fr-FR")} F pour ${palier.prixFcfa.toLocaleString("fr-FR")} F attendus.`,
    };
  }

  const debut = new Date();
  const fin = new Date(debut.getTime() + DUREE_JOURS * 24 * 60 * 60 * 1000);
  const sb = supabaseServer();

  // L'abonnement s'écrit en premier : son index unique sur la référence de
  // transaction arrête ici les rejeux du callback. Si l'insertion passe, c'est
  // que cette transaction n'a jamais été consommée.
  const { error: erreurAbonnement } = await sb.from("abonnement").insert({
    proprietaire_id: session.proprietaireId,
    plan_id: uuidDuPlan(plan),
    montant_fcfa: palier.prixFcfa,
    reference_externe: transactionId,
    periode_debut: debut.toISOString(),
    periode_fin: fin.toISOString(),
  });

  if (erreurAbonnement) {
    if (erreurAbonnement.message?.includes("abonnement_transaction_unique")) {
      // Déjà encaissé : la période est en place, il n'y a rien à refaire.
      return { ok: true };
    }
    return { ok: false, erreur: "Enregistrement de l'abonnement impossible." };
  }

  const { error: erreurPalier } = await sb
    .from("proprietaire")
    .update({ plan_id: uuidDuPlan(plan), plan_expire_le: fin.toISOString() })
    .eq("id", session.proprietaireId);

  if (erreurPalier) {
    // L'argent est encaissé et tracé dans `abonnement` : on ne perd rien, mais
    // le palier n'est pas appliqué. Cas à surveiller côté exploitation.
    return {
      ok: false,
      erreur: "Paiement enregistré, mais le palier n'a pas pu être activé. Contactez le support.",
    };
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
  revalidatePath("/biens");
  revalidatePath("/locataires");
  return { ok: true };
}
