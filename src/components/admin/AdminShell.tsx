import Link from "next/link";
import { logout } from "@/lib/auth/actions";

/**
 * Coquille de l'espace admin : rien du site public, rien du parc d'un
 * bailleur. La session admin roule techniquement sur un compte propriétaire
 * (vide) — sans cette coquille, c'est la navigation bailleur qui s'affichait,
 * sans rapport avec le rôle.
 *
 * Rendue par le layout (app) uniquement sur l'hôte admin pour une session
 * admin. Ailleurs, l'AppShell habituelle s'applique.
 */
const liens = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin?onglet=comptes", label: "Comptes" },
  { href: "/admin?onglet=abonnements", label: "Abonnements" },
  { href: "/admin?onglet=transactions", label: "Transactions" },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper min-h-dvh">
      <header className="border-line bg-surface sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/admin" className="no-underline">
            <span className="text-ink-3 block text-xs font-semibold tracking-widest uppercase">
              Administration
            </span>
            <span className="font-display text-ink text-lg leading-tight font-semibold">
              Pilotage du SaaS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-ink-3 hidden max-w-52 truncate text-sm sm:block">{email}</span>
            <form action={logout} title="Se déconnecter">
              <button
                type="submit"
                aria-label="Se déconnecter"
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <nav className="border-line mx-auto flex max-w-6xl gap-1 overflow-x-auto border-t px-5 sm:px-8" aria-label="Sections admin">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-3 hover:text-ink border-b-2 border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap no-underline transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
