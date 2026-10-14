import { requireAdmin } from "@/lib/admin/guard";
import { AdminDashboard, type OngletAdmin } from "@/components/admin/AdminDashboard";

export const metadata = { title: "Administration" };

const ONGLETS_VALIDES: OngletAdmin[] = ["overview", "comptes", "abonnements", "transactions"];

/** Écran réservé aux e-mails listés dans `ADMIN_EMAILS`. `?onglet=` présélectionne
 *  la section (liens de la coquille admin). */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const demande = (await searchParams).onglet;
  const onglet = ONGLETS_VALIDES.includes(demande as OngletAdmin)
    ? (demande as OngletAdmin)
    : "overview";
  return <AdminDashboard ongletInitial={onglet} />;
}
