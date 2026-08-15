"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProprietaire } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { PLAN_PAR_DEFAUT, PLANS, uuidDuPlan, type PlanId } from "@/lib/plans";

/**
 * Choix d'un palier **gratuit**.
 *
 * Les paliers payants ne passent plus par ici : ils exigent un paiement
 * vérifié, et transitent par `souscrireAbonnement`. Cette action acceptait
 * autrefois n'importe quel palier sans rien facturer — Business était gratuit
 * à qui savait poster le bon formulaire.
 *
 * Elle ne sert donc plus qu'à revenir sur Essentiel avant terme, ce qu'on
 * n'applique d'ailleurs pas immédiatement : une période payée court jusqu'à
 * son échéance. Sans reconduction automatique, « rétrograder » revient à ne
 * pas repayer — il n'y a rien à écrire.
 */
export async function choisirPlan(formData: FormData) {
  const session = await requireProprietaire();

  const plan = String(formData.get("plan") ?? "");
  if (!PLANS[plan as PlanId]) redirect("/plans?erreur=palier");

  // Un palier payant réclamé sans paiement : la porte est fermée.
  if (PLANS[plan as PlanId].prixFcfa > 0) redirect("/plans?erreur=paiement");

  // Essentiel demandé alors qu'une période payée court encore : on ne rembourse
  // pas et on ne coupe pas. Le palier retombera de lui-même à l'échéance.
  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("plan_expire_le")
    .eq("id", session.proprietaireId)
    .maybeSingle();

  if (data?.plan_expire_le && new Date(data.plan_expire_le) > new Date()) {
    redirect("/plans?info=periode-en-cours");
  }

  const { error } = await supabaseServer()
    .from("proprietaire")
    .update({ plan_id: uuidDuPlan(PLAN_PAR_DEFAUT), plan_expire_le: null })
    .eq("id", session.proprietaireId);

  if (error) redirect("/plans?erreur=1");

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  revalidatePath("/biens");
  revalidatePath("/locataires");
  revalidatePath("/loyers");
  redirect("/dashboard");
}
