"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";

/** Après l'inscription (ou depuis la page Tarifs), le propriétaire choisit
 *  son palier. C'est la seule écriture possible sur le plan d'un compte.
 *  Le palier étant relu depuis la base à chaque requête, il s'applique dès la
 *  redirection — sans reconnexion. */
export async function choisirPlan(formData: FormData) {
  const session = await requireProprietaire();

  const plan = String(formData.get("plan") ?? "");
  if (!PLANS[plan as PlanId]) redirect("/plans?erreur=1");

  const { error } = await supabaseServer()
    .from("proprietaire")
    // Même contrainte qu'à l'inscription : la colonne veut l'UUID du palier.
    .update({ plan_id: uuidDuPlan(plan as PlanId) })
    .eq("id", session.proprietaireId);

  if (error) redirect("/plans?erreur=1");

  // Le palier est relu depuis la base à chaque requête : plus besoin de
  // réécrire la session pour qu'il s'applique avant la prochaine connexion.
  revalidatePath("/dashboard");
  revalidatePath("/plans");
  revalidatePath("/biens");
  revalidatePath("/locataires");
  revalidatePath("/loyers");
  redirect("/dashboard");
}
