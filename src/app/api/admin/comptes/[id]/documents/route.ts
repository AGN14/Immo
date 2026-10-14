import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminDossier } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/** Dossier documentaire : biens, lots, photos de pannes, avatars. */
export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const dossier = await getAdminDossier((await params).id);
    if (!dossier) return Response.json({ erreur: "Compte introuvable." }, { status: 404 });
    return Response.json(dossier);
  } catch {
    return Response.json({ erreur: "Dossier indisponible." }, { status: 500 });
  }
}
