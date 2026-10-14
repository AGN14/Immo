"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { logout } from "@/lib/auth/actions";
import { Logo } from "@/components/ui/Logo";
import type { OngletAdmin } from "@/components/admin/AdminDashboard";

/**
 * Coquille de l'espace admin : rail latéral à gauche, même format que la
 * navigation des propriétaires (logo, liens, profil), mais avec les sections
 * du pilotage. La session admin roule techniquement sur un compte
 * propriétaire (vide) — sans cette coquille, c'est la navigation bailleur
 * qui s'affichait, sans rapport avec le rôle.
 *
 * Les liens pilotent l'onglet via l'URL (`?onglet=`) : pas de rechargement,
 * pas d'état local désynchronisé — la barre latérale et les onglets de
 * l'écran lisent la même source. Rendue par le layout (app) uniquement sur
 * l'hôte admin pour une session admin.
 */
const liens: { id: OngletAdmin | "fiche"; label: string; href: string; icone: React.ReactNode }[] =
  [
    { id: "overview", label: "Vue d'ensemble", href: "/admin", icone: <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" /> },
    { id: "comptes", label: "Comptes", href: "/admin?onglet=comptes", icone: <><circle cx="9" cy="8" r="3.5" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /></> },
    { id: "abonnements", label: "Abonnements", href: "/admin?onglet=abonnements", icone: <><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="12" cy="13" r="2" /></> },
    { id: "transactions", label: "Transactions", href: "/admin?onglet=transactions", icone: <><path d="M3 21h18" /><path d="M6 21V10M11 21V4M16 21v-8M21 21V8" /></> },
    { id: "moderation", label: "Modération", href: "/admin?onglet=moderation", icone: <><path d="M12 9v4M12 16.5v.5" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></> },
    { id: "parc", label: "Parc", href: "/admin?onglet=parc", icone: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></> },
    { id: "journal", label: "Journal", href: "/admin?onglet=journal", icone: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" /></> },
    { id: "systeme", label: "Système", href: "/admin?onglet=systeme", icone: <><path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" /></> },
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

/** Onglet lu depuis l'URL : la barre latérale suit l'écran, même après
 *  rechargement ou lien direct. Partagé avec le tableau de bord, qui lit la
 *  même source — c'est ce qui fait le comportement SPA. */
export function useOngletCourant(): OngletAdmin {
  const parametres = useSearchParams();
  const demande = parametres.get("onglet");
  return demande === "comptes" ||
    demande === "abonnements" ||
    demande === "transactions" ||
    demande === "moderation" ||
    demande === "parc" ||
    demande === "journal" ||
    demande === "systeme"
    ? demande
    : "overview";
}

function Navigation({ fermer }: { fermer: () => void }) {
  const onglet = useOngletCourant();
  const chemin = usePathname();
  // Sur une fiche compte, aucun onglet ne s'allume : on n'est dans aucune
  // des sections listées.
  const surFiche = chemin.startsWith("/admin/comptes/");

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Sections admin" onClick={fermer}>
      {liens.map((l) => {
        const actif = !surFiche && onglet === l.id;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={actif ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium no-underline transition-colors ${
              actif ? "bg-primary text-on-primary" : "text-ink-3 hover:bg-sand/60 hover:text-ink"
            }`}
          >
            <span className="shrink-0">
              <Icone>{l.icone}</Icone>
            </span>
            <span className="min-w-0 flex-1 truncate">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const fermer = () => setMobileOuvert(false);
  const initiale = email.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="bg-paper min-h-dvh">
      {/* Mobile : hamburger à gauche, tiroir latéral gauche comme l'app. */}
      <div className="lg:hidden">
        <header className="border-line bg-surface sticky top-0 z-30 border-b">
          <div className="mx-auto flex h-16 items-center gap-3 px-5">
            <button
              type="button"
              onClick={() => setMobileOuvert(true)}
              className="text-ink-3 hover:bg-sand hover:text-ink -ml-2 rounded-md p-2 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Icone>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </Icone>
            </button>
            <Link href="/admin" className="flex items-center no-underline">
              <Logo />
            </Link>
          </div>
        </header>
      </div>

      {mobileOuvert && (
        <div
          className="bg-ink/40 fixed inset-0 z-40 lg:hidden"
          onClick={fermer}
          aria-hidden="true"
        />
      )}

      {/* Rail gauche, même format que la navigation des propriétaires. */}
      <aside
        className={`border-line bg-surface fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r shadow-xl transition-transform duration-200 lg:shadow-none ${
          mobileOuvert ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center no-underline" onClick={fermer}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={fermer}
            className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors lg:hidden"
            aria-label="Fermer le menu"
          >
            <Icone>
              <path d="M6 18L18 6M6 6l12 12" />
            </Icone>
          </button>
        </div>

        {/* Recherche support : un nom, un e-mail, un titre — puis la fiche.
            Simple formulaire GET vers une page serveur, rien de désynchronisé. */}
        <form action="/admin/recherche" method="get" className="shrink-0 px-3 pt-3" onSubmit={fermer}>
          <input
            type="search"
            name="q"
            placeholder="Rechercher…"
            aria-label="Recherche globale"
            className="border-line bg-paper text-ink w-full rounded-md border px-3 py-2 text-sm"
          />
        </form>

        <Suspense>
          <Navigation fermer={fermer} />
        </Suspense>

        <div className="border-line shrink-0 border-t p-3">
          <div className="flex items-center gap-3">
            <span
              className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold"
              aria-hidden="true"
            >
              {initiale}
            </span>
            <span className="text-ink-3 min-w-0 flex-1 truncate text-sm" title={email}>
              {email}
            </span>
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

      <div className="transition-[padding] duration-200 lg:pl-60">
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

/** À l'inverse : depuis l'écran, changer d'onglet met à jour l'URL — la barre
 *  latérale suit sans rechargement. */
export function useAllerOnglet() {
  const router = useRouter();
  return (onglet: OngletAdmin) =>
    router.replace(onglet === "overview" ? "/admin" : `/admin?onglet=${onglet}`, {
      scroll: false,
    });
}
