"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/auth/actions";

/**
 * Coquille de l'espace admin : barre latérale verticale à droite, jamais de
 * barre de navigation en haut. La session admin roule techniquement sur un
 * compte propriétaire (vide) — sans cette coquille, c'est la navigation
 * bailleur qui s'affichait, sans rapport avec le rôle.
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

function Icone({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      {children}
    </svg>
  );
}

const icones = [
  <path key="v" d="M4 19V10M10 19V5M16 19v-7M4 19h16" />,
  <>
    <circle key="c" cx="9" cy="8" r="3.5" />
    <path key="p" d="M3.5 20a5.5 5.5 0 0 1 11 0" />
  </>,
  <>
    <rect key="r" x="3" y="7" width="18" height="12" rx="2" />
    <circle key="o" cx="12" cy="13" r="2" />
  </>,
  <>
    <path key="a" d="M3 21h18" />
    <path key="b" d="M6 21V10M11 21V4M16 21v-8M21 21V8" />
  </>,
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const initiale = email.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="bg-paper min-h-dvh">
      {/* Mobile : simple barre de titre + hamburger, le menu reste un tiroir
          latéral droit. */}
      <div className="lg:hidden">
        <header className="border-line bg-surface sticky top-0 z-30 border-b">
          <div className="mx-auto flex h-16 items-center justify-between gap-4 px-5">
            <div>
              <p className="text-ink-3 text-xs font-semibold tracking-widest uppercase">
                Administration
              </p>
              <p className="font-display text-ink leading-tight font-semibold">Pilotage du SaaS</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOuvert(true)}
              className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-2 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Icone>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </Icone>
            </button>
          </div>
        </header>
      </div>

      {mobileOuvert && (
        <div
          className="bg-ink/40 fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOuvert(false)}
          aria-hidden="true"
        />
      )}

      {/* Rail droit : fixe sur bureau, tiroir sur mobile. */}
      <aside
        className={`border-line bg-surface fixed inset-y-0 right-0 z-50 flex w-64 flex-col border-l shadow-xl transition-transform duration-200 lg:shadow-none ${
          mobileOuvert ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link href="/admin" className="no-underline" onClick={() => setMobileOuvert(false)}>
            <span className="text-ink-3 block text-xs font-semibold tracking-widest uppercase">
              Administration
            </span>
            <span className="font-display text-ink leading-tight font-semibold">
              Pilotage du SaaS
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOuvert(false)}
            className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors lg:hidden"
            aria-label="Fermer le menu"
          >
            <Icone>
              <path d="M6 18L18 6M6 6l12 12" />
            </Icone>
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
          aria-label="Sections admin"
          onClick={() => setMobileOuvert(false)}
        >
          {liens.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-ink-3 hover:bg-sand/60 hover:text-ink flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium no-underline transition-colors"
            >
              <span className="shrink-0">
                <Icone>{icones[i]}</Icone>
              </span>
              <span className="min-w-0 flex-1 truncate">{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-line shrink-0 border-t p-3">
          <div className="flex items-center gap-3">
            <span
              className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold"
              aria-hidden="true"
            >
              {initiale}
            </span>
            <span className="text-ink-3 min-w-0 flex-1 truncate text-sm">{email}</span>
            <form action={logout} title="Se déconnecter">
              <button
                type="submit"
                aria-label="Se déconnecter"
                className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-2 transition-colors"
              >
                <Icone>
                  <>
                    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
                    <path d="M16 8l4 4-4 4M20 12H9" />
                  </>
                </Icone>
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="transition-[padding] duration-200 lg:pr-64">
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
