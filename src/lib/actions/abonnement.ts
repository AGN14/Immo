"use server";

import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";
import { verifierTransaction } from "@/lib/paiement/kkiapay";
import type { EtatAction } from "@/lib/actions/biens";

/** Un mois d'abonnement. Payé d'avance, sans reconduction automatique. */
const DUREE_JOURS = 30;

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
