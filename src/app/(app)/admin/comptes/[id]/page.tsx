import { requireAdmin } from "@/lib/admin/guard";
import { AdminCompteDetail } from "@/components/admin/AdminCompteDetail";

export const metadata = { title: "Fiche compte · Administration" };

export default async function FicheComptePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  return <AdminCompteDetail id={(await params).id} />;
}
