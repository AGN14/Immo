"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ResultatNewsletter =
  | { statut: "ok" }
  | { statut: "erreur"; message: string };

/**
 * Inscription à la newsletter.
 *
 * Le formulaire est public (pied de page) : l'écriture passe par la clé de
 * service, et la case de consentement est vérifiée ici — pas seulement dans
 * l'interface. Sans elle, rien n'est enregistré. La désinscription se fera
 * par le lien prévu dans chaque e-mail, qui passera `actif` à false.
 */
export async function inscrireNewsletter(
  formData: FormData,
): Promise<ResultatNewsletter> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (formData.get("consentement") !== "on") {
    return { statut: "erreur", message: "Merci de cocher la case de consentement." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statut: "erreur", message: "Adresse e-mail invalide." };
  }

  // Réinscrire réactive l'abonnement s'il avait été désactivé.
  const { error } = await supabaseAdmin().from("newsletter_abonne").upsert(
    { email, actif: true },
    { onConflict: "email" },
  );

  if (error) {
    return { statut: "erreur", message: "Une erreur est survenue, réessayez." };
  }

  return { statut: "ok" };
}