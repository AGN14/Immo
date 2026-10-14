import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminJournal } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** Qui a fait quoi, sur quel compte : l'audit des gestes manuels. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminJournal());
  } catch {
    return Response.json({ erreur: "Journal indisponible." }, { status: 500 });
  }
}
