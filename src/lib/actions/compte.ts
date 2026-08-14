"use server";

import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { createSession, destroySession } from "@/lib/auth/mock-session";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { hacherMotDePasse, verifierMotDePasse as verifierHash } from "@/lib/mot-de-passe";
import type { EtatAction } from "@/lib/actions/biens";

/** Renomme le compte. La session porte le nom : elle est réécrite aussi. */
export async function majNom(prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const session = await requireProprietaire();

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { ok: false, erreur: "Le nom est obligatoire." };

  const { error } = await supabaseServer()
    .from("proprietaire")
    .update({ nom })
    .eq("id", session.proprietaireId);

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  await createSession({ ...session, nom });
  revalidatePath("/profil");
  return { ok: true };
}

/** Supprime le compte (soft delete) : le parc et son historique restent en
 *  base, mais l'adresse ne permet plus de se connecter. */
export async function supprimerCompte(): Promise<void> {
  const session = await requireProprietaire();

  const { error } = await supabaseServer()
    .from("proprietaire")
    .update({ supprime_le: new Date().toISOString() })
    .eq("id", session.proprietaireId);

  if (error) return;

  await destroySession();
  redirect("/connexion");
}

/** Jour du mois où les loyers collectés sont reversés au propriétaire. */
export async function majJourReversement(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const session = await requireProprietaire();

  const jour = Number(formData.get("jour"));
  if (!Number.isInteger(jour) || jour < 1 || jour > 28) {
    return { ok: false, erreur: "Choisissez un jour entre 1 et 28." };
  }

  const { error } = await supabaseServer()
    .from("proprietaire")
    .update({ jour_reversement: jour })
    .eq("id", session.proprietaireId);

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/reversements");
  revalidatePath("/profil");
  return { ok: true };
}

/** Vérifie le mot de passe du propriétaire connecté. Sert d'écran de
 *  confirmation avant une modification sensible (ex. modifier un bien). */
export async function verifierMotDePasse(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const session = await requireProprietaire();

  const motDePasse = String(formData.get("motDePasse") ?? "");
  if (!motDePasse) return { ok: false, erreur: "Saisissez votre mot de passe." };

  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("mot_de_passe_hash")
    .eq("id", session.proprietaireId)
    .maybeSingle();

  if (!data?.mot_de_passe_hash) {
    return { ok: false, erreur: "Aucun mot de passe défini : définissez-en un depuis votre profil." };
  }
  if (!verifierHash(motDePasse, data.mot_de_passe_hash)) {
    return { ok: false, erreur: "Mot de passe incorrect." };
  }
  return { ok: true };
}

/** Définit ou change le mot de passe du propriétaire. Le premier mot de passe
 *  s'installe librement ; le suivant exige le précédent. */
export async function majMotDePasse(
  prev: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const session = await requireProprietaire();

  const actuel = String(formData.get("actuel") ?? "");
  const nouveau = String(formData.get("nouveau") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("mot_de_passe_hash")
    .eq("id", session.proprietaireId)
    .maybeSingle();

  if (data?.mot_de_passe_hash && !verifierHash(actuel, data.mot_de_passe_hash)) {
    return { ok: false, erreur: "Mot de passe actuel incorrect." };
  }
  if (nouveau.length < 6) {
    return { ok: false, erreur: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (nouveau !== confirmation) {
    return { ok: false, erreur: "La confirmation ne correspond pas." };
  }

  const { error } = await supabaseServer()
    .from("proprietaire")
    .update({ mot_de_passe_hash: hacherMotDePasse(nouveau) })
    .eq("id", session.proprietaireId);

  if (error) return { ok: false, erreur: `Enregistrement impossible : ${error.message}` };

  revalidatePath("/profil");
  return { ok: true };
}

