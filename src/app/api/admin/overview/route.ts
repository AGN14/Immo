import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminOverview } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminOverview());
  } catch {
    return Response.json({ erreur: "Vue d'ensemble indisponible." }, { status: 500 });
  }
}
