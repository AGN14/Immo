import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminReversements } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** Supervision des reversements aux bailleurs : en retard et échoués d'abord. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminReversements());
  } catch {
    return Response.json({ erreur: "Reversements indisponibles." }, { status: 500 });
  }
}
