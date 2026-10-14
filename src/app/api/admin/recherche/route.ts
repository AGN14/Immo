import { verifierAdminApi } from "@/lib/admin/guard";
import { getAdminRecherche } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET(requete: Request) {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const q = new URL(requete.url).searchParams.get("q") ?? "";
    return Response.json(await getAdminRecherche(q));
  } catch {
    return Response.json({ erreur: "Recherche indisponible." }, { status: 500 });
  }
}
