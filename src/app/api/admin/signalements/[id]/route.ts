import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminSignalement } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const detail = await getAdminSignalement((await params).id);
    if (!detail) return Response.json({ erreur: "Signalement introuvable." }, { status: 404 });
    return Response.json(detail);
  } catch {
    return Response.json({ erreur: "Fiche indisponible." }, { status: 500 });
  }
}
