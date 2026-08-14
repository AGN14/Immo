"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { supabaseServer } from "@/lib/supabase/server";
import { verifierMotDePasse } from "@/lib/mot-de-passe";
import type { CompositionLot, TypeBien } from "@/lib/types";
import { uploaderImage } from "@/lib/actions/stockage";

export type EtatAction = { ok: boolean; erreur?: string };

const compositions = [
  "entrer-coucher",
  "chambre-salon",
  "2-chambres-salon",
  "studio",
  "appartement",
  "villa",
  "boutique",
] as const satisfies readonly CompositionLot[];

const typesDeBien = [
  "immeuble",
  "residence",
  "concession",
  "villa",
  "maison",
] as const satisfies readonly TypeBien[];

/** Les champs communs à la création et à la modification, extraits et validés
 *  une seule fois. Le type est renvoyé brut : le mappeur le contraint. */
function lireChampsBien(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const adresse = String(formData.get("adresse") ?? "").trim();
  const quartier = String(formData.get("quartier") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const superficie = String(formData.get("superficieM2") ?? "").trim();
  const etages = String(formData.get("etages") ?? "").trim();
  const equipement = (nom: string) => formData.get(nom) === "on";

  if (!nom || !adresse || !quartier || !ville)
    return { ok: false as const, erreur: "Le nom, l'adresse, le quartier et la ville sont obligatoires." };
  if (!typesDeBien.some((t) => t === type)) return { ok: false as const, erreur: "Type de bien invalide." };

  const superficieM2 =
    superficie === "" ? null : Math.round(Number(superficie));
  if (superficieM2 !== null && (!Number.isInteger(superficieM2) || superficieM2 <= 0 || superficieM2 > 100000)) {
    return { ok: false as const, erreur: "La superficie doit être un nombre en m² (entre 1 et 100 000)." };
  }

  const etagesValue = etages === "" ? null : Math.round(Number(etages));
  if (etagesValue !== null && (!Number.isInteger(etagesValue) || etagesValue < 1 || etagesValue > 100)) {
    return { ok: false as const, erreur: "Le nombre d'étages doit être compris entre 1 et 100." };
  }

  return {
    ok: true as const,
    valeurs: {
      nom,
      type: type as TypeBien,
      adresse,
      quartier,
      ville,
      description,
      superficie_m2: superficieM2,
      etages: etagesValue,
      garage: equipement("garage"),
      balcon: equipement("balcon"),
      ascenseur: equipement("ascenseur"),
      climatisation: equipement("climatisation"),
    },
  };
}

/** Le mot de passe confirme l'identité avant toute modification sensible. */
async function confirmerMotDePasse(proprietaireId: string, formData: FormData): Promise<string | null> {
  const motDePasse = String(formData.get("motDePasse") ?? "");
  if (!motDePasse) return "Saisissez votre mot de passe pour confirmer la modification.";

  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("mot_de_passe_hash")
    .eq("id", proprietaireId)
    .maybeSingle();

  if (!data?.mot_de_passe_hash) {
    return "Aucun mot de passe défini : définissez-en un depuis votre profil.";
  }
  if (!verifierMotDePasse(motDePasse, data.mot_de_passe_hash)) {
    return "Mot de passe incorrect.";
  }
  return null;
}

export async function creerBien(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const champs = lireChampsBien(formData);
  if (!champs.ok) return champs;

  const fichierImage = formData.get("image");

  const resultatPhoto = await uploaderImage(
    fichierImage instanceof File ? fichierImage : null,
    "biens",
    proprietaireId,
  );
  if (resultatPhoto && "erreur" in resultatPhoto)
    return { ok: false, erreur: resultatPhoto.erreur };
  const imageUrl = resultatPhoto ? resultatPhoto.url : null;

  const { error } = await supabaseServer()
    .from("bien")
    .insert({
      proprietaire_id: proprietaireId,
      ...champs.valeurs,
      image_url: imageUrl,
    });

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/biens");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Modification d'un bien existant — exigée par le mot de passe du
 *  propriétaire. Une nouvelle photo remplace l'ancienne ; sans photo fournie,
 *  l'image actuelle est conservée. */
export async function modifierBien(
  bienId: string,
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const erreurMotDePasse = await confirmerMotDePasse(proprietaireId, formData);
  if (erreurMotDePasse) return { ok: false, erreur: erreurMotDePasse };

  const champs = lireChampsBien(formData);
  if (!champs.ok) return champs;

  // Le bien d'un autre propriétaire est introuvable, pas « interdit ».
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id, image_url")
    .eq("id", bienId)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Bien introuvable." };

  const fichierImage = formData.get("image");
  let imageUrl = bien.image_url;
  if (fichierImage instanceof File && fichierImage.size > 0) {
    const resultatPhoto = await uploaderImage(fichierImage, "biens", proprietaireId);
    if (resultatPhoto && "erreur" in resultatPhoto)
      return { ok: false, erreur: resultatPhoto.erreur };
    imageUrl = resultatPhoto ? resultatPhoto.url : imageUrl;
  }

  const { error } = await supabaseServer()
    .from("bien")
    .update({ ...champs.valeurs, image_url: imageUrl })
    .eq("id", bienId)
    .eq("proprietaire_id", proprietaireId);

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath(`/biens/${bienId}`);
  revalidatePath("/biens");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function creerLot(
  bienId: string,
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const nom = String(formData.get("nom") ?? "").trim();
  const composition = String(formData.get("composition") ?? "");
  const loyer = String(formData.get("loyerReferenceFcfa") ?? "").trim();

  if (!nom || !composition) return { ok: false, erreur: "Le nom et la composition sont obligatoires." };
  if (!compositions.some((c) => c === composition)) return { ok: false, erreur: "Composition invalide." };

  // Le lot d'un autre parc est introuvable, pas « interdit ».
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", bienId)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Bien introuvable." };

  const loyerReferenceFcfa = loyer === "" ? null : Number(loyer);
  if (loyerReferenceFcfa !== null && (!Number.isInteger(loyerReferenceFcfa) || loyerReferenceFcfa < 0)) {
    return { ok: false, erreur: "Le loyer de référence doit être un montant positif." };
  }

  const { error } = await supabaseServer().from("lot").insert({
    bien_id: bienId,
    nom,
    composition,
    loyer_reference_fcfa: loyerReferenceFcfa,
  });

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath(`/biens/${bienId}`);
  revalidatePath("/biens");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Suppression définitive d'un bien — exigée par le mot de passe du
 *  propriétaire. Les lots, baux et paiements du bien sont supprimés en
 *  cascade ; le locataire, lui, reste (son historique appartient au bien). */
export async function supprimerBien(
  bienId: string,
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const erreurMotDePasse = await confirmerMotDePasse(proprietaireId, formData);
  if (erreurMotDePasse) return { ok: false, erreur: erreurMotDePasse };

  // Le bien d'un autre propriétaire est introuvable, pas « interdit ».
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", bienId)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Bien introuvable." };

  const { error } = await supabaseServer()
    .from("bien")
    .delete()
    .eq("id", bienId)
    .eq("proprietaire_id", proprietaireId);

  if (error) return { ok: false, erreur: `Suppression impossible : ${error.message}` };

  revalidatePath("/biens");
  revalidatePath("/dashboard");
  redirect("/biens");
}