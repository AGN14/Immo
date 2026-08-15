"use server";

import { revalidatePath } from "next/cache";
import { requireLocataire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { moisAPayer, penaliteDuMois } from "@/lib/echeances";
import { verifierTransaction } from "@/lib/paiement/kkiapay";
import type { EtatAction } from "@/lib/actions/biens";

/**
 * Encaissement d'un paiement en ligne.
 *
 * Contrairement à la déclaration manuelle, l'argent est déjà arrivé : le
 * versement naît donc `confirme`, avec `confirme_par = 'operateur'`, et les
 * quittances partent dans la foulée. Le propriétaire n'a rien à pointer — le
 * modèle prévoyait ce cas depuis le début.
 *
 * Tout l'enjeu tient dans ce que l'on refuse de croire. Le navigateur nous
 * transmet un identifiant de transaction et rien d'autre : ni le montant, ni
 * les mois couverts, ni le statut. Ces trois-là sont recalculés ou vérifiés
 * côté serveur, faute de quoi n'importe qui solderait son année en appelant
 * cette action à la main.
 */
export async function encaisserPaiementEnLigne(
  transactionId: string,
  moisChoisis: string[],
): Promise<EtatAction> {
  const { locataireId } = await requireLocataire();

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

  // Le montant attendu est RECALCULÉ ici. Celui qu'affichait le widget vient
  // du navigateur : s'y fier permettrait de payer un franc pour trois mois.
  const penalites = mois.map((m) => penaliteDuMois(m, bail, proprietaire));
  const penalitesFcfa = penalites.reduce((s, p) => s + p, 0);
  const attenduFcfa = mois.length * bail.loyerMensuelFcfa + penalitesFcfa;

  const transaction = await verifierTransaction(transactionId);
  if (!transaction.valide) {
    return { ok: false, erreur: "Paiement non confirmé par l'opérateur." };
  }
  if (transaction.montantFcfa < attenduFcfa) {
    return {
      ok: false,
      erreur: `Montant encaissé insuffisant : ${transaction.montantFcfa.toLocaleString("fr-FR")} F pour ${attenduFcfa.toLocaleString("fr-FR")} F attendus.`,
    };
  }

  const sb = supabaseServer();

  const { data: versement, error: erreurVersement } = await sb
    .from("versement")
    .insert({
      bail_id: bail.id,
      montant_total_fcfa: attenduFcfa,
      penalites_fcfa: penalitesFcfa,
      methode: "mobile-money",
      reference_externe: transactionId,
      statut: "confirme",
      confirme_par: "operateur",
      confirme_le: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (erreurVersement || !versement) {
    // L'index unique sur (reference_externe, confirme_par='operateur') arrête
    // ici les rejeux du callback : rechargement de page, double-clic, ou appel
    // délibéré. Le message reste positif — l'argent est bien encaissé, le
    // versement existe déjà.
    if (erreurVersement?.message?.includes("versement_transaction_operateur_unique")) {
      return { ok: true };
    }
    return { ok: false, erreur: "Enregistrement du paiement impossible." };
  }

  const { error: erreurPaiements } = await sb.from("paiement").insert(
    mois.map((periode, i) => ({
      bail_id: bail.id,
      versement_id: versement.id,
      periode,
      montant_fcfa: bail.loyerMensuelFcfa,
      penalite_fcfa: penalites[i],
    })),
  );
  if (erreurPaiements) return { ok: false, erreur: "Enregistrement des mois impossible." };

  // Les quittances suivent l'encaissement, pas la confirmation d'un humain :
  // le locataire est libéré de sa dette au moment où l'argent arrive.
  const { data: lignes } = await sb
    .from("paiement")
    .select("id")
    .eq("versement_id", versement.id);

  for (const ligne of lignes ?? []) {
    const { data: numero } = await sb.rpc("prochain_numero_quittance", {
      p_proprietaire_id: proprietaire.id,
    });
    if (!numero) continue;
    await sb.from("quittance").insert({
      paiement_id: ligne.id,
      proprietaire_id: proprietaire.id,
      numero,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/payer");
  return { ok: true };
}
