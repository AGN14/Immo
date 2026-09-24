/**
 * Garde d'accès admin.
 *
 * Pas de rôle en base pour l'instant : l'admin est désigné par son e-mail,
 * listé dans `ADMIN_EMAILS` (séparés par des virgules). C'est volontairement
 * fruste — un seul point à configurer, aucune migration — et suffisant tant
 * que l'équipe tient dans cette liste.
 *
 * Toutes les lectures admin passent par la clé de service (RLS contournée) :
 * ce fichier ne quitte jamais le serveur.
 */
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hoteAdminAutorise } from "@/lib/admin/host";

function lireEmailsAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return lireEmailsAdmin().includes(email.trim().toLowerCase());
}

/** Écran /admin : sans session → connexion, non-admin → dashboard. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!isAdminEmail(session.email)) redirect("/dashboard");
  return session;
}

/** Routes /api/admin/* : même règle, mais en 401/403 JSON plutôt qu'en redirection. */
export async function verifierAdminApi(): Promise<{ ok: true; email: string } | Response> {
  // Seconde barrière derrière le proxy : l'API n'existe que sur le
  // sous-domaine admin (ou en local). Réponse 404, comme pour les pages.
  const enTetes = await headers();
  const hoteDemande = enTetes.get("x-forwarded-host") ?? enTetes.get("host");
  if (!hoteAdminAutorise(hoteDemande, process.env.ADMIN_HOST)) {
    return Response.json({ erreur: "Introuvable." }, { status: 404 });
  }

  const session = await getSession();
  if (!session) {
    return Response.json({ erreur: "Non authentifié." }, { status: 401 });
  }
  if (!isAdminEmail(session.email)) {
    return Response.json({ erreur: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  return { ok: true, email: session.email };
}
