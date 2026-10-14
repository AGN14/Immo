import { verifierAdminApi } from "@/lib/admin/guard";
import { modererSignalement } from "@/lib/admin/queries";
import type { StatutSignalement, UrgenceSignalement } from "@/lib/types";

export const dynamic = "force-dynamic";

async function moderer(
  requete: Request,
  id: string,
  changement: { statut?: StatutSignalement; urgence?: UrgenceSignalement },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  const resultat = await modererSignalement(id, changement, garde.email);
  if (!resultat.ok) return Response.json({ erreur: resultat.erreur }, { status: 400 });
  return Response.json({ ok: true });
}

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const corps = (await requete.json()) as { statut?: StatutSignalement };
  return moderer(requete, (await params).id, { statut: corps.statut });
}
