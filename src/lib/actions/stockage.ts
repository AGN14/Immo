"use server";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Upload d'une photo dans le bucket public « immo », sous le dossier du
 * propriétaire. Retourne l'URL publique, `null` si aucun fichier, ou une
 * erreur descriptive. C'est le seul point d'entrée vers le stockage : les
 * tailles et formats sont contrôlés ici, jamais côté client.
 */

const BUCKET = "immo";
const TAILLE_MAX = 5 * 1024 * 1024;
const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type ResultatUpload = { url: string } | { erreur: string } | null;

export async function uploaderImage(
  fichier: File | undefined | null,
  dossier: string,
  proprietaireId: string,
): Promise<ResultatUpload> {
  if (!fichier || fichier.size === 0) return null;

  if (fichier.size > TAILLE_MAX) return { erreur: "L'image dépasse 5 Mo." };
  if (!TYPES_ACCEPTES.includes(fichier.type)) {
    return { erreur: "Format non pris en charge (JPG, PNG, WebP ou GIF)." };
  }

  const extension = (fichier.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const chemin = `${dossier}/${proprietaireId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabaseServer().storage
    .from(BUCKET)
    .upload(chemin, fichier, { contentType: fichier.type, upsert: false });

  if (error) return { erreur: `Envoi de l'image impossible : ${error.message}` };

  const { data } = supabaseServer().storage.from(BUCKET).getPublicUrl(chemin);
  return { url: data.publicUrl };
}
