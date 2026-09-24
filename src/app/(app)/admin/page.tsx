import { requireAdmin } from "@/lib/admin/guard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = { title: "Administration" };

/** Écran réservé aux e-mails listés dans `ADMIN_EMAILS`. */
export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
