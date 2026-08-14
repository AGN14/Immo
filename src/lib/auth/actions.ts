"use server";

import { redirect } from "next/navigation";
import {
  getLocataireByEmail,
  getProprietaireByEmail,
  getProprietaireById,
  PROPRIETAIRE_DEMO,
} from "@/lib/mock-data";
import { PLAN_PAR_DEFAUT, type PlanId } from "@/lib/plans";
import { createSession, destroySession, type Session } from "@/lib/auth/mock-session";

/**
 * À la connexion, le rôle et le périmètre appartiennent au compte, jamais au
 * formulaire : il n'y a qu'une seule connexion et c'est la résolution de
 * l'utilisateur qui oriente. En attendant le vrai backend, on interroge les
 * annuaires de démonstration.
 */
function resolveUser(email: string): Session {
  const normalise = email.trim().toLowerCase();

  const locataire = getLocataireByEmail(normalise);
  if (locataire) {
    return {
      role: "locataire",
      nom: locataire.nom,
      email: normalise,
      locataireId: locataire.id,
    };
  }

  const proprietaire = getProprietaireByEmail(normalise);
  if (proprietaire) {
    return {
      role: "proprietaire",
      nom: proprietaire.nom,
      email: normalise,
      proprietaireId: proprietaire.id,
      plan: proprietaire.plan,
    };
  }

  // Tout e-mail inconnu est rattaché au parc de démonstration, faute de base
  // d'utilisateurs. Avec un vrai backend, ce cas devient un échec de connexion.
  const demo = getProprietaireById(PROPRIETAIRE_DEMO);
  return {
    role: "proprietaire",
    nom: normalise.split("@")[0] || "Vous",
    email: normalise,
    proprietaireId: demo?.id,
    plan: demo?.plan,
  };
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  await createSession(resolveUser(email));
  redirect("/dashboard");
}

/** À l'inscription, en revanche, le profil est bien un choix de l'utilisateur. */
export async function signup(formData: FormData) {
  const role = formData.get("role") === "locataire" ? "locataire" : "proprietaire";
  const nom = String(formData.get("nom") ?? "Vous");
  const email = String(formData.get("email") ?? "");
  const codeBien = formData.get("codeBien");
  // Le lien « Passer en Pro » de la page Tarifs transporte le palier choisi.
  const plan: PlanId = formData.get("plan") === "pro" ? "pro" : PLAN_PAR_DEFAUT;

  await createSession({
    role,
    nom,
    email,
    codeBien: role === "locataire" && codeBien ? String(codeBien) : undefined,
    // Un nouveau compte n'a pas encore de parc : on le rattache au parc de
    // démonstration pour que les écrans aient quelque chose à montrer.
    proprietaireId: role === "proprietaire" ? PROPRIETAIRE_DEMO : undefined,
    plan: role === "proprietaire" ? plan : undefined,
  });
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}
