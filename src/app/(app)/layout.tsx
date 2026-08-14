import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PLANS } from "@/lib/plans";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion");

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
