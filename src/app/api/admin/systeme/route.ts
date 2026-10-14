import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminSysteme } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** État de la plateforme : base, opérateur de paiement, déploiement. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminSysteme());
  } catch {
    return Response.json({ erreur: "État indisponible." }, { status: 500 });
  }
}
