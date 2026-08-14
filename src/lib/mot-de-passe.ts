import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Hash le mot de passe avec un sel aléatoire, au format « sel:hash ». */
export function hacherMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const hash = scryptSync(motDePasse, sel, 64).toString("hex");
  return `${sel}:${hash}`;
}

/** Compare en temps constant : ni la longueur ni le sel ne fuient. */
export function verifierMotDePasse(motDePasse: string, stocke: string): boolean {
  const [sel, hash] = stocke.split(":");
  if (!sel || !hash) return false;
  const attendu = Buffer.from(hash, "hex");
  const calcule = scryptSync(motDePasse, sel, 64);
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}
