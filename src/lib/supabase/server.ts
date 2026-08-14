import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types.generated";

/**
 * Client Supabase côté serveur.
 *
 * Il utilise la clé de service, qui contourne RLS : le cloisonnement effectif
 * est assuré par src/lib/data, où chaque requête exige un proprietaire_id.
 * Cette clé ne doit jamais franchir la frontière du serveur — d'où le
 * `server-only` en tête de fichier, qui fait échouer la compilation si un
 * composant client tente de l'importer.
 *
 * Le jour où Supabase Auth sera branché, ce client cédera la place à un client
 * porteur du jeton de l'utilisateur, et RLS deviendra la garantie principale.
 */

let client: SupabaseClient<Database> | null = null;

function lireVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. ` +
        `Copiez .env.example vers .env.local et renseignez-la depuis ` +
        `Supabase → Project Settings → API.`,
    );
  }
  return valeur;
}

export function supabaseServer(): SupabaseClient<Database> {
  if (client) return client;

  client = createClient<Database>(
    lireVariable("NEXT_PUBLIC_SUPABASE_URL"),
    lireVariable("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return client;
}

/** Vrai si la base est configurée — permet de retomber sur les données de
 *  démonstration tant que le projet Supabase n'existe pas. */
export function supabaseConfigure(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
