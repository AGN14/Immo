"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  creerSignalement,
  creerVersement,
  changerStatutSignalement,
} from "@/lib/mock-data/mutations";
import { getBailDuLocataire, getSignalementsDuLocataire } from "@/lib/mock-data";
import { requireLocataire } from "@/lib/auth/mock-session";
import type { MethodePaiement, UrgenceSignalement } from "@/lib/types";

/**
 * Actions de l'espace locataire.
 *
 * Le périmètre est **toujours** repris de la session, jamais du formulaire :
 * un identifiant de bail posté à la main ne doit pas permettre de payer ou de
 * signaler sur le logement d'un autre.
 */

const METHODES: MethodePaiement[] = ["mobile-money", "virement", "especes"];
const URGENCES: UrgenceSignalement[] = ["basse", "normale", "haute"];

export async function declarerPaiement(formData: FormData) {
  const { locataireId } = await requireLocataire();

  const bail = getBailDuLocataire(locataireId);
  if (!bail) redirect("/dashboard?erreur=aucun-bail");

  const nombreMois = Number(formData.get("nombreMois") ?? 1);
  const methodeSaisie = String(formData.get("methode") ?? "");
  const methode: MethodePaiement = METHODES.includes(methodeSaisie as MethodePaiement)
    ? (methodeSaisie as MethodePaiement)
    : "mobile-money";

  const resultat = creerVersement({
    bailId: bail.id,
    nombreMois,
    methode,
    reference: String(formData.get("reference") ?? ""),
  });

  if ("erreur" in resultat) redirect(`/payer?erreur=${resultat.erreur}`);

  revalidatePath("/dashboard");
  revalidatePath("/payer");
  redirect(`/dashboard?paiement=declare&mois=${resultat.mois.length}`);
}

export async function signalerProbleme(formData: FormData) {
  const { locataireId } = await requireLocataire();

  const bail = getBailDuLocataire(locataireId);
  if (!bail) redirect("/dashboard?erreur=aucun-bail");

  const urgenceSaisie = String(formData.get("urgence") ?? "");
  const urgence: UrgenceSignalement = URGENCES.includes(urgenceSaisie as UrgenceSignalement)
    ? (urgenceSaisie as UrgenceSignalement)
    : "normale";

  const resultat = creerSignalement({
    lotId: bail.lotId,
    bailId: bail.id,
    titre: String(formData.get("titre") ?? ""),
    description: String(formData.get("description") ?? ""),
    urgence,
  });

  if ("erreur" in resultat) redirect(`/signaler?erreur=${resultat.erreur}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?signalement=cree");
}

/** Le locataire valide la résolution. C'est ce qui clôt vraiment un problème. */
export async function confirmerResolution(formData: FormData) {
  const { locataireId } = await requireLocataire();
  const id = String(formData.get("signalementId") ?? "");

  // Le signalement doit appartenir au locataire : on le cherche dans son
  // périmètre plutôt que par identifiant seul.
  const sien = getSignalementsDuLocataire(locataireId).some((s) => s.id === id);
  if (!sien) redirect("/dashboard");

  changerStatutSignalement(id, "confirme");
  revalidatePath("/dashboard");
  redirect("/dashboard?signalement=confirme");
}
