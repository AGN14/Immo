"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PLAN_PAR_DEFAUT, PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";
import { destroySession } from "@/lib/auth/session";

/**
 * Authentification par Supabase Auth.
 *
 * Les mots de passe vivent dans `auth.users`, hachés par Supabase — jamais
 * dans nos tables. Nos fiches `proprietaire` et `locataire` ne portent que le
 * lien `auth_user_id`, sur lequel s'appuient toutes les politiques RLS.
 *
 * Une seule connexion pour les deux rôles : c'est la fiche rattachée au compte
 * qui détermine où l'on atterrit, jamais le formulaire.
 */

/** Longueur minimale, alignée sur le réglage Supabase. */
const LONGUEUR_MINIMALE = 8;

/**
 * L'origine réelle de la requête, pour construire les liens des e-mails.
 * En dur, un lien de réinitialisation pointerait vers localhost dans les
 * courriels envoyés depuis une autre machine du réseau.
 */
async function origine(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole = h.get("x-forwarded-proto") ?? "http";
  return `${protocole}://${hote}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("password") ?? "");

  const { error } = await supabaseUtilisateur().auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  // Adresse inconnue et mot de passe faux donnent le même message : le
  // formulaire ne doit pas devenir un moyen de savoir qui a un compte ici.
  if (error) redirect("/connexion?erreur=identifiants");

  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}

/**
 * À l'inscription, le profil est un choix de l'utilisateur — contrairement à
 * la connexion, où il se déduit du compte.
 *
 * Deux écritures, dans cet ordre : le compte Supabase Auth, puis la fiche
 * métier qui le référence. Si la seconde échoue, on supprime le compte : un
 * utilisateur authentifié sans fiche ne peut rien faire et bloquerait son
 * adresse pour une nouvelle tentative.
 */
export async function signup(formData: FormData) {
  const role = formData.get("role") === "locataire" ? "locataire" : "proprietaire";
  const nom = String(formData.get("nom") ?? "Vous").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("password") ?? "");
  const page = role === "locataire" ? "/inscription/locataire" : "/inscription/proprietaire";

  if (motDePasse.length < LONGUEUR_MINIMALE) redirect(`${page}?erreur=court`);

  // Le code de bien est vérifié AVANT de créer quoi que ce soit : inutile
  // d'ouvrir un compte qui ne pourra être rattaché à aucun parc.
  let proprietaireId: string | null = null;
  if (role === "locataire") {
    const code = String(formData.get("codeBien") ?? "")
      .trim()
      .toUpperCase();
    if (!code) redirect(`${page}?erreur=code`);

    // Client d'administration : le futur locataire n'a pas encore de jeton, et
    // n'aura jamais le droit de lire la table `bien` de ce propriétaire.
    const { data: bien } = await supabaseAdmin()
      .from("bien")
      .select("proprietaire_id")
      .eq("code", code)
      .maybeSingle();

    if (!bien) redirect(`${page}?erreur=code`);
    proprietaireId = bien.proprietaire_id;
  }

  const { data: compte, error: erreurCompte } = await supabaseUtilisateur().auth.signUp({
    email,
    password: motDePasse,
  });

  if (erreurCompte || !compte.user) {
    const deja = erreurCompte?.message?.toLowerCase().includes("already");
    redirect(`${page}?erreur=${deja ? "existe" : "1"}`);
  }

  const admin = supabaseAdmin();
  const authUserId = compte.user.id;

  const { error: erreurFiche } =
    role === "locataire"
      ? await admin
          .from("locataire")
          .insert({ proprietaire_id: proprietaireId!, nom, email, auth_user_id: authUserId })
      : await admin.from("proprietaire").insert({
          nom,
          email,
          auth_user_id: authUserId,
          plan_id: uuidDuPlan(planDemande(formData)),
        });

  if (erreurFiche) {
    // Sans fiche, le compte est inutilisable : on ne laisse pas de coquille.
    await admin.auth.admin.deleteUser(authUserId);
    redirect(`${page}?erreur=1`);
  }

  // Le propriétaire choisit son palier ; le locataire va droit à son espace.
  redirect(role === "proprietaire" ? "/plans" : "/dashboard");
}

/** Le lien « Passer en Pro » de la page Tarifs transporte le palier choisi. */
function planDemande(formData: FormData): PlanId {
  const demande = String(formData.get("plan") ?? "");
  return PLANS[demande as PlanId] ? (demande as PlanId) : PLAN_PAR_DEFAUT;
}

/**
 * Mot de passe oublié — première étape : l'envoi du lien.
 *
 * On répond la même chose que l'adresse existe ou non. Confirmer qu'un compte
 * existe renseignerait un attaquant, et l'utilisateur légitime, lui, reçoit
 * bien son courriel.
 */
export async function demanderReinitialisation(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (email) {
    await supabaseUtilisateur().auth.resetPasswordForEmail(email, {
      redirectTo: `${await origine()}/auth/rappel?suite=/reinitialiser`,
    });
  }

  redirect("/connexion/oublie?envoye=1");
}

/**
 * Seconde étape : le nouveau mot de passe.
 *
 * Le lien du courriel a ouvert une session — c'est elle qui autorise le
 * changement. Sans session valide, `updateUser` échoue, ce qui interdit de
 * réinitialiser le mot de passe d'autrui en devinant une URL.
 */
export async function definirNouveauMotDePasse(formData: FormData) {
  const motDePasse = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < LONGUEUR_MINIMALE) redirect("/reinitialiser?erreur=court");
  if (motDePasse !== confirmation) redirect("/reinitialiser?erreur=confirmation");

  const { error } = await supabaseUtilisateur().auth.updateUser({ password: motDePasse });
  if (error) redirect("/reinitialiser?erreur=expire");

  redirect("/dashboard");
}
