import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/guard";
import { estSurHoteAdmin, normaliserHote } from "@/lib/admin/host";
import { PLANS } from "@/lib/plans";
import { AppShell } from "@/components/dashboard/AppShell";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  // Sur l'hôte admin, une session admin bascule sur la coquille admin :
  // navigation pilotage (comptes, abonnements, transactions), rien du parc
  // d'un bailleur. Partout ailleurs — et pour les autres sessions — l'AppShell
  // habituelle s'applique, l'existence de l'admin n'y transparaît pas.
  const enTetes = await headers();
  const hote = normaliserHote(enTetes.get("x-forwarded-host") ?? enTetes.get("host"));
  if (estSurHoteAdmin(hote, process.env.ADMIN_HOST) && isAdminEmail(session.email)) {
    return <AdminShell email={session.email}>{children}</AdminShell>;
  }

  const plan = session.plan ? PLANS[session.plan] : null;

  return (
    <AppShell
      nom={session.nom}
      role={session.role}
      plan={plan ? { nom: plan.nom, prixFcfa: plan.prixFcfa } : null}
      planId={session.plan}
    >
      {children}
    </AppShell>
  );
}
