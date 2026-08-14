import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PlanId } from "@/lib/plans";

export type Role = "proprietaire" | "locataire";

export interface Session {
  role: Role;
  nom: string;
  email: string;
  /** Identifiant du propriétaire connecté. Absent pour un locataire. */
  proprietaireId?: string;
  /** Identifiant du locataire connecté. Absent pour un propriétaire. */
  locataireId?: string;
  codeBien?: string;
  /** Palier du propriétaire. Vivra sur sa ligne en base ; transite ici en attendant. */
  plan?: PlanId;
}

/** Session d'un propriétaire : l'identifiant y est garanti. */
export type SessionProprietaire = Session & { role: "proprietaire"; proprietaireId: string };

/** Session d'un locataire : l'identifiant y est garanti. */
export type SessionLocataire = Session & { role: "locataire"; locataireId: string };

const COOKIE_NAME = "immo_session";

export async function createSession(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * Porte d'entrée des écrans propriétaire. Sans session on renvoie à la
 * connexion, et un locataire n'atteint jamais le parc d'un propriétaire —
 * même en tapant l'URL à la main.
 */
export async function requireProprietaire(): Promise<SessionProprietaire> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "proprietaire" || !session.proprietaireId) redirect("/dashboard");
  return session as SessionProprietaire;
}

/**
 * Pendant de requireProprietaire pour l'espace locataire. Un propriétaire n'y
 * entre pas, et un locataire sans identifiant est une session invalide.
 */
export async function requireLocataire(): Promise<SessionLocataire> {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "locataire") redirect("/dashboard");
  if (!session.locataireId) redirect("/connexion");
  return session as SessionLocataire;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
