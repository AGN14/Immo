import { requireAdmin } from "@/lib/admin/guard";
import { AdminSignalementDetail } from "@/components/admin/AdminSignalementDetail";

export const metadata = { title: "Dossier · Modération" };

export default async function DossierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  return <AdminSignalementDetail id={(await params).id} />;
}
