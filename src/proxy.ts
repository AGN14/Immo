import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Rafraîchissement de session et redirections d'authentification.
 *
 * Le premier rôle est le plus important : les jetons Supabase expirent au bout
 * d'une heure, et seul un point capable d'**écrire** des cookies peut les
 * renouveler. Un Server Component ne le peut pas — d'où ce passage à chaque
 * requête. Sans lui, les sessions tomberaient sans explication.
 *
 * Le second est le garde-barrière. On ne se fie qu'à `getUser()`, qui valide
 * le jeton auprès du serveur d'authentification : la seule présence d'un
 * cookie ne prouve rien, il peut être forgé ou périmé.
 */

/** Les espaces qui exigent une session. Le reste est public. */
const ESPACES_PROTEGES = [
  "/dashboard",
  "/biens",
  "/locataires",
  "/loyers",
  "/baux",
  "/cautions",
  "/gestionnaires",
  "/reversements",
  "/signalements",
  "/signaler",
  "/payer",
  "/profil",
  "/plans",
  "/analyses",
  "/rapports",
  "/relances",
];

/** Écrans d'authentification : sans objet quand on est déjà connecté. */
const PAGES_AUTH = ["/connexion", "/inscription"];

const correspond = (chemin: string, prefixes: string[]) =>
  prefixes.some((p) => chemin === p || chemin.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(aPoser) {
          for (const { name, value } of aPoser) request.cookies.set(name, value);
          reponse = NextResponse.next({ request });
          for (const { name, value, options } of aPoser) {
            reponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Ne rien insérer entre la création du client et cet appel : c'est lui qui
  // déclenche le renouvellement du jeton.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && correspond(pathname, ESPACES_PROTEGES)) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  // `/reinitialiser` reste accessible connecté : on y arrive justement par un
  // lien d'e-mail qui vient d'ouvrir une session.
  if (user && correspond(pathname, PAGES_AUTH)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return reponse;
}

export const config = {
  /**
   * Tout sauf les ressources statiques : le renouvellement du jeton doit avoir
   * lieu à chaque navigation, pas seulement sur les pages protégées.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
