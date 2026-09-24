import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { estSurHoteAdmin, hoteAdminAutorise } from "@/lib/admin/host";

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
  "/admin",
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
  "/quittances",
  "/historique",
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

  const hoteDemande =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const surHoteAdmin = estSurHoteAdmin(hoteDemande, process.env.ADMIN_HOST);

  // L'admin n'existe que sur son sous-domaine : ailleurs, 404 sec plutôt
  // qu'une redirection qui avouerait l'existence de la page. Vérifié avant
  // l'authentification — un visiteur non connecté n'apprend rien.
  if (correspond(pathname, ["/admin", "/api/admin"])) {
    if (!hoteAdminAutorise(hoteDemande, process.env.ADMIN_HOST)) {
      return new NextResponse("Introuvable.", { status: 404 });
    }
  }

  // Sur le sous-domaine admin, aucun point d'entrée public : la racine et les
  // écrans d'authentification rabattent vers la connexion admin. Les autres
  // chemins publics restent techniquement adressables, mais le secret est le
  // nom d'hôte lui-même — et /admin* garde sa propre garde.
  if (surHoteAdmin) {
    if (pathname === "/") return NextResponse.redirect(new URL("/admin", request.url));
    if (pathname === "/connexion" || correspond(pathname, ["/inscription"])) {
      return NextResponse.redirect(new URL("/admin/connexion", request.url));
    }
  }

  // La connexion admin est le seul écran protégé accessible sans session :
  // sans cette exception, elle rebouclerait vers elle-même.
  if (!user && correspond(pathname, ESPACES_PROTEGES) && pathname !== "/admin/connexion") {
    const cible = surHoteAdmin ? "/admin/connexion" : "/connexion";
    return NextResponse.redirect(new URL(cible, request.url));
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
