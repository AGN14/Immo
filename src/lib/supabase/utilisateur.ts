import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types.generated";

/**
 * Client serveur porteur du jeton de l'utilisateur connecté.
 *
 * C'est le changement de fond apporté par Supabase Auth : la clé publiable est
 * soumise à RLS, donc **la base décide** de ce que chacun peut lire. Les
 * filtres par `proprietaire_id` de `src/lib/data` restent en place, mais comme
 * seconde barrière et confort de lecture — plus comme unique défense.
 *
 * La fonction reste synchrone alors que `cookies()` ne l'est pas : les
 * accesseurs passés à `createServerClient` acceptent des fonctions
 * asynchrones, ce qui évite d'écrire `await` sur chacun des appels.
 */

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

export function supabaseUtilisateur(): SupabaseClient<Database> {
  return createServerClient<Database>(
    lireVariable("NEXT_PUBLIC_SUPABASE_URL"),
    lireVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        async getAll() {
          return (await cookies()).getAll();
        },
        async setAll(aPoser) {
          try {
            const magasin = await cookies();
            for (const { name, value, options } of aPoser) {
              magasin.set(name, value, options);
            }
          } catch {
            // Écrire un cookie depuis un Server Component est interdit par
            // Next. Sans conséquence : le proxy rafraîchit la session à chaque
            // requête, et c'est lui qui pose le jeton renouvelé.
          }
        },
      },
    },
  );
}
