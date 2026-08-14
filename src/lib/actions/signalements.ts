"use server";

import { revalidatePath } from "next/cache";
import { requireLocataire, requireProprietaire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { getBailDuLocataire } from "@/lib/data";
import { uploaderImage } from "@/lib/actions/stockage";
import type { EtatAction } from "@/lib/actions/biens";
import type { StatutSignalement, UrgenceSignalement } from "@/lib/types";

const urgences = ["basse", "normale", "haute"] as const satisfies readonly UrgenceSignalement[];

/** Le locataire signale un problème sur le logement qu'il occupe. Sans bail
 *  actif, rien à signaler : le logement n'est pas le sien. */
export async function creerSignalement(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { locataireId } = await requireLocataire();

  const bail = await getBailDuLocataire(locataireId);
  if (!bail) return { ok: false, erreur: "Aucun logement actif sur ce compte." };

  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const urgence = String(formData.get("urgence") ?? "normale");
  const fichierImage = formData.get("photo");

  if (!titre) return { ok: false, erreur: "Le titre est obligatoire." };
  if (!description) return { ok: false, erreur: "Décrivez le problème." };
  if (!urgences.some((u) => u === urgence))
    return { ok: false, erreur: "Niveau d'urgence invalide." };

  const resultatPhoto = await uploaderImage(
    fichierImage instanceof File ? fichierImage : null,
    "signalements",
    locataireId,
  );
  if (resultatPhoto && "erreur" in resultatPhoto)
    return { ok: false, erreur: resultatPhoto.erreur };
  const photoUrl = resultatPhoto ? resultatPhoto.url : null;

  const sb = supabaseServer();
  const { data: signalement, error } = await sb
    .from("signalement")
    .insert({
      lot_id: bail.lotId,
      bail_id: bail.id,
      titre,
      description,
      urgence,
      statut: "signale",
    })
    .select("id")
    .maybeSingle();
  if (error || !signalement)
    return { ok: false, erreur: `Envoi impossible : ${error?.message ?? "inconnue"}` };

  if (photoUrl) {
    const { error: erreurPhoto } = await sb.from("signalement_photo").insert({
      signalement_id: signalement.id,
      chemin: photoUrl,
      ordre: 0,
    });
    if (erreurPhoto)
      return {
        ok: false,
        erreur: `Signalement enregistré, mais la photo n'a pas pu être jointe : ${erreurPhoto.message}`,
      };
  }

  revalidatePath("/signaler");
  return { ok: true };
}

/** Les transitions du fil : le propriétaire prend en charge, résout ou
 *  annule ; la confirmation finale appartient au locataire. */
const transitionsProprietaire: Record<string, StatutSignalement[]> = {
  signale: ["pris-en-charge", "annule"],
  "pris-en-charge": ["resolu", "annule"],
};

/** Action du propriétaire sur un signalement de son parc. */
export async function changerStatutSignalement(
  signalementId: string,
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const cible = String(formData.get("statut") ?? "") as StatutSignalement;

  // Le signalement doit appartenir au parc : lot → bien → propriétaire.
  const { data: signalement } = await supabaseServer()
    .from("signalement")
    .select("id, statut, lot_id, resolu_le")
    .eq("id", signalementId)
    .maybeSingle();
  if (!signalement) return { ok: false, erreur: "Signalement introuvable." };

  const { data: lot } = await supabaseServer()
    .from("lot")
    .select("bien_id")
    .eq("id", signalement.lot_id)
    .maybeSingle();
  if (!lot) return { ok: false, erreur: "Logement introuvable." };
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", lot.bien_id)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Ce signalement n'appartient pas à votre parc." };

  const autorisees = transitionsProprietaire[signalement.statut] ?? [];
  if (!autorisees.includes(cible))
    return { ok: false, erreur: "Transition de statut interdite." };

  const { error } = await supabaseServer()
    .from("signalement")
    .update({
      statut: cible,
      resolu_le: cible === "resolu" ? new Date().toISOString() : signalement.resolu_le,
      confirme_le: null,
    })
    .eq("id", signalementId);
  if (error) return { ok: false, erreur: `Mise à jour impossible : ${error.message}` };

  revalidatePath("/signalements");
  return { ok: true };
}

/** Le locataire valide la résolution : c'est lui qui sait si le problème est
 *  réglé. Sans cette confirmation, le fil ne se ferme jamais. */
export async function confirmerResolution(
  signalementId: string,
  _prev: EtatAction,
  _formData: FormData,
): Promise<EtatAction> {
  const { locataireId } = await requireLocataire();

  const bail = await getBailDuLocataire(locataireId);
  if (!bail) return { ok: false, erreur: "Aucun logement actif sur ce compte." };

  const { data: signalement } = await supabaseServer()
    .from("signalement")
    .select("id, statut, bail_id")
    .eq("id", signalementId)
    .maybeSingle();
  if (!signalement) return { ok: false, erreur: "Signalement introuvable." };
  if (signalement.bail_id !== bail.id || signalement.statut !== "resolu")
    return { ok: false, erreur: "Rien à confirmer sur ce signalement." };

  const { error } = await supabaseServer()
    .from("signalement")
    .update({ statut: "confirme", confirme_le: new Date().toISOString() })
    .eq("id", signalementId);
  if (error) return { ok: false, erreur: `Mise à jour impossible : ${error.message}` };

  revalidatePath("/signaler");
  return { ok: true };
}
