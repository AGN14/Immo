import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminSignalements } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminSignalements());
  } catch {
    return Response.json({ erreur: "Signalements indisponibles." }, { status: 500 });
  }
}
