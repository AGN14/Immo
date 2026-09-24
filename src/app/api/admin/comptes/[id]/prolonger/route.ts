import { verifierAdminApi } from "@/lib/admin/guard";
import { prolongerAbonnementAdmin } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const corps = (await requete.json()) as { jours?: number };
    const resultat = await prolongerAbonnementAdmin((await params).id, corps.jours);
    return Response.json({ ok: true, ...resultat });
  } catch (e) {
    return Response.json({ erreur: e instanceof Error ? e.message : "Action impossible." }, { status: 400 });
  }
}
