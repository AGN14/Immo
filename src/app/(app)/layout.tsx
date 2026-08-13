import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/mock-session";
import { AppNav } from "@/components/app/AppNav";
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
        <div className="mx-auto flex h-[70px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-[0.65rem] no-underline">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-ink text-[0.86rem] font-semibold">{session.nom}</div>
              <div className="text-ink-3 text-[0.74rem]">{roleLabels[session.role]}</div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="border-line text-ink-2 hover:border-primary hover:text-primary rounded-pill border px-4 py-2 text-[0.82rem] font-semibold"
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
