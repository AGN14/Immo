import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types.generated";

/**
 * Client anonyme (clé publique, soumise à RLS) pour les écritures ouvertes :
 * mesure d'audience, inscription newsletter. Aucune session, aucun cookie —
 * la base n'accepte que ce que les politiques d'insertion autorisent.
 */
export function supabaseAnon(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) throw new Error("Configuration Supabase incomplète.");
  return createClient<Database>(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
