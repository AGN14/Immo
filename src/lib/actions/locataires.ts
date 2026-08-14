"use server";

import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { supabaseServer } from "@/lib/supabase/server";
import type { EtatAction } from "@/lib/actions/biens";
import type { PieceIdentite } from "@/lib/types";
import { uploaderImage } from "@/lib/actions/stockage";

const pieces = ["cni", "passeport", "permis", "carte-sejour", "autre"] as const satisfies readonly PieceIdentite[];

export async function creerLocataire(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const dateNaissance = String(formData.get("dateNaissance") ?? "").trim() || null;
  const pieceType = String(formData.get("pieceType") ?? "").trim() || null;
  const pieceNumero = String(formData.get("pieceNumero") ?? "").trim() || null;
  const profession = String(formData.get("profession") ?? "").trim() || null;
  const occupants = String(formData.get("occupants") ?? "").trim();
  const garantNom = String(formData.get("garantNom") ?? "").trim() || null;
  const garantTelephone = String(formData.get("garantTelephone") ?? "").trim() || null;
  const fichierImage = formData.get("photo");

  if (!nom) return { ok: false, erreur: "Le nom est obligatoire." };
  if (dateNaissance && !/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance))
    return { ok: false, erreur: "La date de naissance est invalide." };
  if (pieceType && !pieces.some((p) => p === pieceType))
    return { ok: false, erreur: "Type de pièce d'identité invalide." };
  if (pieceType && !pieceNumero)
    return { ok: false, erreur: "Le numéro de la pièce d'identité est obligatoire." };
  if (pieceNumero && !pieceType)
    return { ok: false, erreur: "Choisissez le type de pièce d'identité." };
  if (occupants !== "" && (!Number.isInteger(Number(occupants)) || Number(occupants) < 1 || Number(occupants) > 50))
    return { ok: false, erreur: "Le nombre d'occupants doit être compris entre 1 et 50." };
  if (garantTelephone && !garantNom)
    return { ok: false, erreur: "Renseignez le nom du garant si vous donnez son téléphone." };

  const resultatPhoto = await uploaderImage(
    fichierImage instanceof File ? fichierImage : null,
    "locataires",
    proprietaireId,
  );
  if (resultatPhoto && "erreur" in resultatPhoto)
    return { ok: false, erreur: resultatPhoto.erreur };
  const photoUrl = resultatPhoto ? resultatPhoto.url : null;

  const { error } = await supabaseServer().from("locataire").insert({
    proprietaire_id: proprietaireId,
    nom,
    email,
    telephone,
    photo_url: photoUrl,
    date_naissance: dateNaissance,
    piece_type: pieceType,
    piece_numero: pieceNumero,
    profession,
    occupants: occupants === "" ? null : Number(occupants),
    garant_nom: garantNom,
    garant_telephone: garantTelephone,
  });

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/locataires");
  return { ok: true };
}

/**
 * Attribue un logement : crée le bail actif. Le quota est défendu en base par
 * le trigger bail_verifier_quota — on traduit son refus en message lisible.
 */
export async function creerBail(prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const locataireId = String(formData.get("locataireId") ?? "");
  const lotId = String(formData.get("lotId") ?? "");
  const loyer = Number(formData.get("loyerMensuelFcfa") ?? "NaN");
  const dateDebut = String(formData.get("dateDebut") ?? "");
  const jourEcheance = String(formData.get("jourEcheance") ?? "").trim();

  if (!locataireId || !lotId || !dateDebut)
    return { ok: false, erreur: "Locataire, logement et date de début sont obligatoires." };
  if (!Number.isInteger(loyer) || loyer < 0)
    return { ok: false, erreur: "Le loyer doit être un montant positif." };

  // Les deux doivent appartenir au parc demandeur.
  const [{ data: locataire }, { data: lot }] = await Promise.all([
    supabaseServer()
      .from("locataire")
      .select("id")
      .eq("id", locataireId)
      .eq("proprietaire_id", proprietaireId)
      .maybeSingle(),
    supabaseServer()
      .from("lot")
      .select("bien_id, loyer_reference_fcfa")
      .eq("id", lotId)
      .maybeSingle(),
  ]);
  if (!locataire || !lot) return { ok: false, erreur: "Locataire ou logement introuvable." };

  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", lot.bien_id)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Ce logement n'appartient pas à votre parc." };

  const jour = jourEcheance === "" ? null : Number(jourEcheance);
  if (jour !== null && (!Number.isInteger(jour) || jour < 1 || jour > 31))
    return { ok: false, erreur: "Le jour d'échéance doit être compris entre 1 et 31." };

  const { error } = await supabaseServer().from("bail").insert({
    lot_id: lotId,
    locataire_id: locataireId,
    loyer_mensuel_fcfa: loyer,
    date_debut: dateDebut,
    statut: "actif",
    jour_echeance: jour,
  });

  if (error) {
    if (error.message.includes("QUOTA_ATTEINT"))
      return {
        ok: false,
        erreur:
          "Quota de votre palier atteint : ce logement porterait le nombre de baux actifs au-delà de la limite. Passez au palier supérieur pour en louer plus.",
      };
    if (error.message.includes("bail_un_seul_actif_par_lot"))
      return { ok: false, erreur: "Ce logement est déjà loué." };
    return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };
  }

  revalidatePath("/locataires");
  revalidatePath("/loyers");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function terminerBail(
  bailId: string,
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const dateFin = String(formData.get("dateFin") ?? "");

  if (!bailId || !dateFin) return { ok: false, erreur: "La date de fin est obligatoire." };

  // Le bail doit être du parc, et encore actif.
  const { data: bail } = await supabaseServer()
    .from("bail")
    .select("id, lot_id, date_debut")
    .eq("id", bailId)
    .eq("statut", "actif")
    .maybeSingle();
  if (!bail) return { ok: false, erreur: "Bail introuvable ou déjà terminé." };

  const { data: lot } = await supabaseServer()
    .from("lot")
    .select("bien_id")
    .eq("id", bail.lot_id)
    .maybeSingle();
  if (!lot) return { ok: false, erreur: "Logement introuvable." };
  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("id")
    .eq("id", lot.bien_id)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!bien) return { ok: false, erreur: "Ce bail n'appartient pas à votre parc." };

  if (dateFin < bail.date_debut)
    return { ok: false, erreur: "La date de fin doit suivre la date de début." };

  const { error } = await supabaseServer()
    .from("bail")
    .update({ statut: "termine", date_fin: dateFin })
    .eq("id", bailId);

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/locataires");
  revalidatePath("/loyers");
  revalidatePath("/dashboard");
  revalidatePath("/biens");
  return { ok: true };
}