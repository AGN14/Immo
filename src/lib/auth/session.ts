import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { planDepuisUuid, type PlanId } from "@/lib/plans";

/**
 * La session, adossée à Supabase Auth.
 *
 * Le jeton dit **qui** est connecté ; c'est la base qui dit **ce qu'il est**.
 * On ne stocke donc plus le rôle ni le palier dans un cookie : ils se
 * résolvent à chaque requête depuis `auth_user_id`, et un changement de palier
 * s'applique immédiatement sans reconnexion.
 *
 * `getUser()` et non `getSession()` : le premier valide le jeton auprès du
 * serveur d'authentification, le second se contente de lire le cookie — qui
 * peut être forgé ou périmé.
 *
 * La résolution passe par le client utilisateur, donc par RLS : chacun ne peut
 * lire que sa propre fiche, ce qui rend l'usurpation impossible même en cas
 * d'erreur applicative.
 */

export type Role = "proprietaire" | "locataire";

export interface Session {
  role: Role;
  nom: string;
  email: string;
  /** Identifiant du propriétaire connecté. Absent pour un locataire. */
  proprietaireId?: string;
  /** Identifiant du locataire connecté. Absent pour un propriétaire. */
  locataireId?: string;
  /** Palier du propriétaire, ou celui de son bailleur pour un locataire. */
  plan?: PlanId;
}

/** Session d'un propriétaire : l'identifiant y est garanti. */
export type SessionProprietaire = Session & { role: "proprietaire"; proprietaireId: string };

/** Session d'un locataire : l'identifiant y est garanti. */
export type SessionLocataire = Session & { role: "locataire"; locataireId: string };

/**
 * Mémorisé pour la durée du rendu : une page qui vérifie la session dans son
 * layout, sa page et deux actions ne déclenche qu'une validation de jeton.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const sb = supabaseUtilisateur();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: proprietaire } = await sb
    .from("proprietaire")
    .select("id, nom, plan_id")
    .eq("auth_user_id", user.id)
    .is("supprime_le", null)
    .maybeSingle();

  if (proprietaire) {
    return {
      role: "proprietaire",
      nom: proprietaire.nom,
      email: user.email ?? "",
      proprietaireId: proprietaire.id,
      plan: planDepuisUuid(proprietaire.plan_id),
    };
  }

  const { data: locataire } = await sb
    .from("locataire")
    .select("id, nom")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (locataire) {
    // Pas de palier côté locataire : il ne paie rien et ne voit aucune
    // fonctionnalité gradée. Le transporter n'aurait servi qu'à exposer une
    // information commerciale sur son bailleur.
    return {
      role: "locataire",
      nom: locataire.nom,
      email: user.email ?? "",
      locataireId: locataire.id,
    };
  }

  // Authentifié mais sans fiche : compte à demi créé, ou fiche supprimée.
  return null;
});

/**
 * Porte d'entrée des écrans propriétaire. Sans session on renvoie à la
 * connexion, et un locataire n'atteint jamais le parc d'un propriétaire —
 * même en tapant l'URL à la main.
 */
export async function requireProprietaire(): Promise<SessionProprietaire> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "proprietaire" || !session.proprietaireId) redirect("/dashboard");
  return session as SessionProprietaire;
}

/**
 * Pendant de requireProprietaire pour l'espace locataire. Un propriétaire n'y
 * entre pas, et un locataire sans identifiant est une session invalide.
 */
export async function requireLocataire(): Promise<SessionLocataire> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "locataire") redirect("/dashboard");
  if (!session.locataireId) redirect("/connexion");
  return session as SessionLocataire;
}

/** Ferme la session Supabase. Les cookies sont effacés par le client lui-même. */
export async function destroySession() {
  await supabaseUtilisateur().auth.signOut();
}
