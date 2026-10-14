import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminParc } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** Santé locative globale : occupation, villes, attentes, signalements. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    return Response.json(await getAdminParc());
  } catch {
    return Response.json({ erreur: "Parc indisponible." }, { status: 500 });
  }
}
