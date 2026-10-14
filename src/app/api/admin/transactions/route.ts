import { verifierAdminApi } from "@/lib/admin/guard";
import {
  diagnostiquerConfiguration,
  geniuspayBacASable,
  listerPaiements,
} from "@/lib/paiement/geniuspay";

export const dynamic = "force-dynamic";

/** L'historique marchand : loyers et abonnements vus par l'opérateur. */
export async function GET() {
  const garde = await verifierAdminApi();
  if (garde instanceof Response) return garde;
  try {
    const [transactions, diagnostic] = await Promise.all([
      listerPaiements({ parPage: 50 }),
      diagnostiquerConfiguration(),
    ]);
    return Response.json({ transactions, diagnostic, bacASable: geniuspayBacASable() });
  } catch {
    return Response.json({ erreur: "Transactions indisponibles." }, { status: 500 });
  }
}
