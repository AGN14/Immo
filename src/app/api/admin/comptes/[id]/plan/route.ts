import { verifierAdminApi } from "@/lib/admin/guard";
import { appliquerPlanAdmin } from "@/lib/admin/queries";
import type { PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const corps = (await requete.json()) as { plan?: PlanId; jours?: number };
    const resultat = await appliquerPlanAdmin((await params).id, corps.plan as PlanId, corps.jours);
    return Response.json({ ok: true, ...resultat });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : "Action impossible." }, { status: 400 });
  }
}
