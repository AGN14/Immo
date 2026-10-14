import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminAudience } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** Ce que le public fait du site : visites consenties, funnel, newsletter, relances. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminAudience());
  } catch {
    return Response.json({ erreur: "Audience indisponible." }, { status: 500 });
  }
}
