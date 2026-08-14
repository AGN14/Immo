"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changerStatutSignalement,
  confirmerVersement,
  rejeterVersement,
} from "@/lib/mock-data/mutations";
import { getSignalements, getVersementById } from "@/lib/mock-data";
import { requireProprietaire } from "@/lib/auth/mock-session";
import type { StatutSignalement } from "@/lib/types";

/**
 * Actions du propriétaire.
 *
 * Chaque action revérifie que l'objet visé appartient bien à son parc : elle
 * le cherche via une lecture cloisonnée plutôt que par identifiant seul. Un
 * bouton masqué dans l'interface n'arrête pas un appel direct.
 */

export async function validerVersement(formData: FormData) {
  const { proprietaireId } = await requireProprietaire();
  const id = String(formData.get("versementId") ?? "");

  if (!getVersementById(proprietaireId, id)) redirect("/versements");

  confirmerVersement(id, "proprietaire");
  revalidatePath("/versements");
  revalidatePath("/loyers");
  redirect("/versements?confirme=1");
}

export async function refuserVersement(formData: FormData) {
  const { proprietaireId } = await requireProprietaire();
  const id = String(formData.get("versementId") ?? "");

  if (!getVersementById(proprietaireId, id)) redirect("/versements");

  rejeterVersement(id);
  revalidatePath("/versements");
  revalidatePath("/loyers");
  redirect("/versements?refuse=1");
}

const STATUTS: StatutSignalement[] = ["pris-en-charge", "resolu", "annule"];

export async function avancerSignalement(formData: FormData) {
  const { proprietaireId } = await requireProprietaire();
  const id = String(formData.get("signalementId") ?? "");
  const vers = String(formData.get("vers") ?? "");

  if (!getSignalements(proprietaireId).some((s) => s.id === id)) redirect("/signalements");
  // « confirme » est réservé au locataire : le propriétaire ne clôt pas seul.
  if (!STATUTS.includes(vers as StatutSignalement)) redirect("/signalements");

  changerStatutSignalement(id, vers as StatutSignalement);
  revalidatePath("/signalements");
  revalidatePath("/dashboard");
  redirect("/signalements");
}
