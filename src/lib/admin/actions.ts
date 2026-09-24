/**
 * Connexion réservée à l'équipe — l'autre guichet, sur l'autre sous-domaine.
 *
 * Même vérification que la connexion publique auprès de Supabase Auth, puis
 * contrôle de l'e-mail contre `ADMIN_EMAILS`. Un compte ordinaire qui se
 * trompe de porte est déconnecté aussitôt : sa session du site public, portée
 * par un autre hôte, n'est pas touchée.
 */
"use server";

import { redirect } from "next/navigation";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { destroySession, getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/guard";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const motDePasse = String(formData.get("password") ?? "");

  const { error } = await supabaseUtilisateur().auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  // Même discrétion que côté public : inconnu et mot de passe faux partagent
  // le même message, le formulaire ne révèle pas qui a un compte.
  if (error) redirect("/admin/connexion?erreur=identifiants");

  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) {
    await destroySession();
    redirect("/admin/connexion?erreur=reserve");
  }

  redirect("/admin");
}
