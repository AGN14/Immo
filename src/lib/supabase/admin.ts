import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types.generated";

/**
 * Client d'administration — clé secrète, RLS contournée.
 *
 * Réservé aux opérations qui précèdent l'authentification, ou qui dépassent par
 * nature le périmètre d'un compte :
 *
 *   — l'inscription, qui crée la fiche `proprietaire`/`locataire` AVANT que
 *     `auth_user_id` ne la rende visible à son titulaire ;
 *   — la résolution d'un code de bien, que le futur locataire n'a pas encore
 *     le droit de lire ;
 *   — la création du compte Supabase Auth lui-même.
 *
 * Partout ailleurs : `supabaseUtilisateur()`. Chaque appel à ce client-ci est
 * une exception, et doit se justifier en commentaire sur place.
 */

let client: SupabaseClient<Database> | null = null;

function lireVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. ` +
        `Copiez .env.example vers .env et renseignez-la depuis ` +
        `Supabase → Project Settings → API.`,
    );
  }
  return valeur;
}

export function supabaseAdmin(): SupabaseClient<Database> {
  if (client) return client;

  client = createClient<Database>(
    lireVariable("NEXT_PUBLIC_SUPABASE_URL"),
    lireVariable("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  return client;
}
