import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminComptes } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminComptes());
  } catch {
    return Response.json({ erreur: "Comptes indisponibles." }, { status: 500 });
  }
}
