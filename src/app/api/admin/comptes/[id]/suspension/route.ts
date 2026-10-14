import { verifierAdminApi } from "@/lib/admin/guard";
import { reintegrerCompteAdmin, suspenderCompteAdmin } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/**
 * Restriction d'un compte : `{ suspendu: true, motif? }` suspend (session et
 * RLS coupées, données intactes), `{ suspendu: false }` réintègre. Jamais sur
 * un e-mail d'équipe.
 */
export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const corps = (await requete.json()) as { suspendu?: boolean; motif?: string };
    const resultat = corps.suspendu
      ? await suspenderCompteAdmin((await params).id, garde.email, String(corps.motif ?? ""))
      : await reintegrerCompteAdmin((await params).id, garde.email);
    if (!resultat.ok) return Response.json({ erreur: resultat.erreur }, { status: 400 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ erreur: "Action impossible." }, { status: 400 });
  }
}
