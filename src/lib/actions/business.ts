"use server";

import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { supabaseServer } from "@/lib/supabase/server";
import type { EtatAction } from "@/lib/actions/biens";
import type { StatutCaution } from "@/lib/types";

/** Ajoute un membre à l'équipe de gestion du parc (plan Business). */
export async function creerGestionnaire(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const telephone = String(formData.get("telephone") ?? "").trim() || null;

  if (!nom) return { ok: false, erreur: "Le nom est obligatoire." };

  const { error } = await supabaseServer().from("gestionnaire").insert({
    proprietaire_id: proprietaireId,
    nom,
    email,
    telephone,
  });

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/gestionnaires");
  return { ok: true };
}

/** Retire un membre de l'équipe de gestion. */
export async function supprimerGestionnaire(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const id = String(formData.get("id") ?? "");

  const { error } = await supabaseServer()
    .from("gestionnaire")
    .delete()
    .eq("id", id)
    .eq("proprietaire_id", proprietaireId);

  if (error) return { ok: false, erreur: `Suppression impossible : ${error.message}` };

  revalidatePath("/gestionnaires");
  return { ok: true };
}

const statuts: Record<StatutCaution, StatutCaution | null> = {
  due: "encaisee",
  encaisee: "restituee",
  restituee: null,
};

/** Avance une caution : due → encaissée → restituée. */
export async function avancerCaution(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const { proprietaireId } = await requireProprietaire();

  const id = String(formData.get("id") ?? "");

  // La caution doit appartenir à un bail du parc.
  const { data: caution } = await supabaseServer()
    .from("caution")
    .select("id, statut, bail!inner(lot!inner(bien!inner(proprietaire_id)))")
    .eq("id", id)
    .eq("bail.lot.bien.proprietaire_id", proprietaireId)
    .maybeSingle();
  if (!caution) return { ok: false, erreur: "Caution introuvable." };

  const prochain = statuts[caution.statut as StatutCaution];
  if (!prochain) return { ok: false, erreur: "Caution déjà restituée." };

  const maintenant = new Date().toISOString();
  const { error } = await supabaseServer()
    .from("caution")
    .update(
      prochain === "encaisee"
        ? { statut: prochain, encaissee_le: maintenant }
        : { statut: prochain, restituee_le: maintenant },
    )
    .eq("id", id);

  if (error) return { ok: false, erreur: `Mise à jour impossible : ${error.message}` };

  revalidatePath("/cautions");
  return { ok: true };
}
