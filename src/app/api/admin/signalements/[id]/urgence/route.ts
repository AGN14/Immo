import { verifierAdminApi } from "@/lib/admin/guard";
import { modererSignalement } from "@/lib/admin/queries";
import type { UrgenceSignalement } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  const corps = (await requete.json()) as { urgence?: UrgenceSignalement };
  const resultat = await modererSignalement((await params).id, { urgence: corps.urgence }, garde.email);
  if (!resultat.ok) return Response.json({ erreur: resultat.erreur }, { status: 400 });
  return Response.json({ ok: true });
}
