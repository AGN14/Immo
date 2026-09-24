import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminAbonnements } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminAbonnements());
  } catch {
    return Response.json({ erreur: "Abonnements indisponibles." }, { status: 500 });
  }
}
