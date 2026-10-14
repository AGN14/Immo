import { requireAdmin } from "@/lib/admin/guard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = { title: "Administration" };

/** Écran réservé aux e-mails listés dans `ADMIN_EMAILS`. L'onglet se lit côté
 *  client dans l'URL (`?onglet=`) : liens profonds et navigation sans
 *  rechargement, sans état serveur. */
export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
