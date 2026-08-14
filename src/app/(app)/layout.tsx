import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/mock-session";
import { AppNav } from "@/components/dashboard/AppNav";
import { Logo } from "@/components/ui/Logo";

const roleLabels = {
  proprietaire: "Propriétaire",
  locataire: "Locataire",
} as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  return (
    <div className="bg-paper min-h-dvh">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-ink font-semibold">{session.nom}</div>
              <div className="text-ink-3">{roleLabels[session.role]}</div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="border-line text-ink-2 hover:border-ink-3 hover:text-ink rounded-md border px-3 py-2 text-sm font-medium transition-colors"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <AppNav role={session.role} />
      <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
