"use server";

import { redirect } from "next/navigation";
import { getLocataireByEmail, getProprietaireByEmail } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import { PLAN_PAR_DEFAUT, PLANS, planDepuisUuid, uuidDuPlan, type PlanId } from "@/lib/plans";
import { createSession, destroySession, type Session } from "@/lib/auth/mock-session";

/**
 * À la connexion, le rôle et le périmètre appartiennent au compte, jamais au
 * formulaire : il n'y a qu'une seule connexion et c'est la résolution de
 * l'utilisateur qui oriente. Un e-mail inconnu échoue proprement.
 */
async function resolveUser(email: string): Promise<Session | null> {
  const normalise = email.trim().toLowerCase();

  const locataire = await getLocataireByEmail(normalise);
  if (locataire) {
    // Le locataire vit sous le plan de son propriétaire : on le fait transiter
    // par la session pour la cohérence, sans jamais l'afficher de son côté.
    const { data: proprio } = await supabaseServer()
      .from("proprietaire")
      .select("plan_id")
      .eq("id", locataire.proprietaireId)
      .maybeSingle();
    return {
      role: "locataire",
      nom: locataire.nom,
      email: normalise,
      locataireId: locataire.id,
      plan: proprio ? planDepuisUuid(proprio.plan_id) : undefined,
    };
  }

  const proprietaire = await getProprietaireByEmail(normalise);
  if (proprietaire) {
    return {
      role: "proprietaire",
      nom: proprietaire.nom,
      email: normalise,
      proprietaireId: proprietaire.id,
      plan: proprietaire.plan,
    };
  }

  return null;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const session = await resolveUser(email);
  if (!session) redirect("/connexion?erreur=1");
  await createSession(session);
  redirect("/dashboard");
}

/** À l'inscription, en revanche, le profil est bien un choix de l'utilisateur. */
export async function signup(formData: FormData) {
  const role = formData.get("role") === "locataire" ? "locataire" : "proprietaire";
  const nom = String(formData.get("nom") ?? "Vous");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const codeBien = formData.get("codeBien");

  const session =
    role === "locataire"
      ? await creerCompteLocataire(nom, email, codeBien)
      : await creerCompteProprietaire(nom, email, formData);

  if (!session) redirect("/inscription?erreur=1");
  await createSession(session);

  // Le propriétaire fraîchement inscrit passe par le choix de son palier ;
  // le locataire, lui, atterrit directement sur son espace.
  if (session.role === "proprietaire") redirect("/plans");
  redirect("/dashboard");
}

/** Le lien « Passer en Pro » ou « Passer en Business » de la page Tarifs
 *  transporte le palier choisi ; tout le reste tombe sur le plan par défaut. */
async function creerCompteProprietaire(
  nom: string,
  email: string,
  formData: FormData,
): Promise<Session | null> {
  const planDemande = String(formData.get("plan") ?? "");
  const plan: PlanId = PLANS[planDemande as PlanId] ? (planDemande as PlanId) : PLAN_PAR_DEFAUT;

  const { data, error } = await supabaseServer()
    .from("proprietaire")
    // La colonne attend l'UUID du palier, plus son slug : insérer « pro » ici
    // faisait échouer l'inscription sur un type invalide.
    .insert({ nom, email, plan_id: uuidDuPlan(plan) })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;

  return {
    role: "proprietaire",
    nom,
    email,
    proprietaireId: data.id,
    plan,
  };
}

/**
 * Le locataire rejoint le parc de son propriétaire avec le code du bien.
 * Sans code valide, pas de compte : l'inconnu n'expose jamais un parc.
 */
async function creerCompteLocataire(
  nom: string,
  email: string,
  codeBien: FormDataEntryValue | null,
): Promise<Session | null> {
  const code = String(codeBien ?? "")
    .trim()
    .toUpperCase();
  if (!code) return null;

  const { data: bien } = await supabaseServer()
    .from("bien")
    .select("proprietaire_id")
    .eq("code", code)
    .maybeSingle();
  if (!bien) return null;

  const { data, error } = await supabaseServer()
    .from("locataire")
    .insert({ proprietaire_id: bien.proprietaire_id, nom, email })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;

  return {
    role: "locataire",
    nom,
    email,
    locataireId: data.id,
    codeBien: code,
  };
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}
