"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireProprietaire } from "@/lib/auth/session";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import type { EtatAction } from "@/lib/actions/biens";

/**
 * Invitations de locataires.
 *
 * Elles remplacent le code de bien comme chemin sûr : nominatives, à usage
 * unique, elles expirent, et c'est le propriétaire qui décide qui entre. Le
 * code, lui, était affiché sur la fiche du bien — donc dans toutes les captures
 * d'écran — et n'exigeait aucune validation de sa part.
 *
 * Rien n'est envoyé par e-mail : ici le canal est WhatsApp. On produit un lien,
 * le propriétaire le transmet comme il l'entend. C'est aussi ce qui rend la
 * fonction utilisable avant même que le SMTP soit en place.
 */

/** Durée de validité, alignée sur le défaut de la base. */
const JOURS_VALIDITE = 7;

/**
 * 32 octets tirés au sort, en base64url — donc utilisable tel quel dans une
 * URL, sans échappement. Un identifiant séquentiel ou un UUID se devinerait ou
 * se recopierait ; ce jeton, non.
 */
function nouveauJeton(): string {
  return randomBytes(32).toString("base64url");
}

async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole = h.get("x-forwarded-proto") ?? "http";
  return `${protocole}://${hote}`;
}

/** Le lien à transmettre au locataire. Reconstruit à l'affichage, jamais stocké :
 *  l'adresse du site change entre le développement et la production. */
export async function lienInvitation(jeton: string): Promise<string> {
  return `${await origine()}/inscription/locataire?invitation=${jeton}`;
}

export async function creerInvitation(
  _etat: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const nom = String(formData.get("nom") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const lotId = String(formData.get("lotId") ?? "").trim() || null;

  if (!nom) return { ok: false, erreur: "Indiquez au moins le nom du locataire." };

  const expireLe = new Date(Date.now() + JOURS_VALIDITE * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseUtilisateur().from("invitation").insert({
    proprietaire_id: proprietaireId,
    lot_id: lotId,
    jeton: nouveauJeton(),
    nom,
    telephone,
    email,
    expire_le: expireLe,
  });

  if (error) return { ok: false, erreur: `Invitation impossible : ${error.message}` };

  revalidatePath("/locataires");
  return { ok: true };
}

/** Révoquer, c'est supprimer : une invitation non utilisée ne laisse aucune
 *  trace utile, et la garder « annulée » ferait un lien mort de plus à lire. */
export async function revoquerInvitation(formData: FormData): Promise<void> {
  const { proprietaireId } = await requireProprietaire();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabaseUtilisateur()
    .from("invitation")
    .delete()
    .eq("id", id)
    .eq("proprietaire_id", proprietaireId);

  revalidatePath("/locataires");
}
