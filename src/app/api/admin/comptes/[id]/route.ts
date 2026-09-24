import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminCompteDetail } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const detail = await getAdminCompteDetail((await params).id);
    if (!detail) return Response.json({ erreur: "Compte introuvable." }, { status: 404 });
    return Response.json(detail);
  } catch {
    return Response.json({ erreur: "Fiche compte indisponible." }, { status: 500 });
  }
}
