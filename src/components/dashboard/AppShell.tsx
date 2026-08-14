"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { logout } from "@/lib/auth/actions";
import { Logo } from "@/components/ui/Logo";
import { planSuffisant, type PlanId } from "@/lib/plans";

type Icône = { label: string; href: string; icône: ReactNode; planRequis?: PlanId };

const icône = (d: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-5"
  >
    {d}
  </svg>
);

const entrées: Icône[] = [
  {
    label: "Vue d'ensemble",
    href: "/dashboard",
    icône: icône(<path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />),
  },
  {
    label: "Biens",
    href: "/biens",
    icône: icône(
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>,
    ),
  },
  {
    label: "Locataires",
    href: "/locataires",
    icône: icône(
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M15.5 5.2a3.5 3.5 0 0 1 0 5.6M17.5 14.3A5.5 5.5 0 0 1 20.5 20" />
      </>,
    ),
  },
  {
    label: "Loyers",
    href: "/loyers",
    icône: icône(
      <>
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <circle cx="12" cy="13" r="2" />
      </>,
    ),
  },
  {
    label: "Baux",
    href: "/baux",
    planRequis: "pro",
    icône: icône(
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>,
    ),
  },
  {
    label: "Reversements",
    href: "/reversements",
    planRequis: "pro",
    icône: icône(<path d="M5 12h14M13 6l6 6-6 6" />),
  },
  {
    label: "Signalements",
    href: "/signalements",
    planRequis: "pro",
    icône: icône(
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
    ),
  },
  {
    label: "Analyses & Export",
    href: "/analyses",
    planRequis: "business",
    icône: icône(
      <>
        <path d="M3 21h18" />
        <path d="M6 21V10M11 21V4M16 21v-8M21 21V8" />
      </>,
    ),
  },
  {
    label: "Relances & Alertes",
    href: "/relances",
    planRequis: "business",
    icône: icône(<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />),
  },
  {
    label: "Cautions",
    href: "/cautions",
    planRequis: "business",
    icône: icône(<path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" />),
  },
  {
    label: "Gestionnaires",
    href: "/gestionnaires",
    planRequis: "business",
    icône: icône(
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      </>,
    ),
  },
  {
    label: "Rapports",
    href: "/rapports",
    planRequis: "business",
    icône: icône(<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />),
  },
];

const entréesLocataire: Icône[] = [
  {
    label: "Vue d'ensemble",
    href: "/dashboard",
    icône: icône(<path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />),
  },
  {
    label: "Payer mon loyer",
    href: "/payer",
    icône: icône(<path d="M5 13l4 4L19 7" />),
  },
  {
    label: "Signaler un problème",
    href: "/signaler",
    icône: icône(
      <>
        <path d="M12 3l9 16H3z" />
        <path d="M12 9v4M12 16.5v.5" />
      </>,
    ),
  },
];

const roleLabels = {
  proprietaire: "Propriétaire",
  locataire: "Locataire",
} as const;

const cleLocalStorage = "immo:sidebar:ouvert";

/** Coquille de l'application. Sur bureau, tout vit dans la sidebar (logo,
 *  navigation, session) : l'écran est entièrement dédié aux données. La
 *  sidebar se replie en rail d'icônes ; la préférence est mémorisée. */
export function AppShell({
  nom,
  role,
  plan,
  planId,
  children,
}: {
  nom: string;
  role: "proprietaire" | "locataire";
  /** Palier courant, mis en avant pour le propriétaire : cliquer dessus
   *  mène à la page qui permet de le changer. */
  plan: { nom: string; prixFcfa: number } | null;
  /** Identifiant du palier courant : sert à verrouiller les entrées
   *  réservées aux paliers supérieurs. */
  planId?: PlanId | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(cleLocalStorage) !== "ferme";
  });
  const [mobileOuvert, setMobileOuvert] = useState(false);

  useEffect(() => {
    if (mobileOuvert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOuvert]);

  const basculer = () => {
    setOuvert((o) => {
      const prochain = !o;
      window.localStorage.setItem(cleLocalStorage, prochain ? "ouvert" : "ferme");
      return prochain;
    });
  };

  const nav = role === "locataire" ? entréesLocataire : entrées;
  const estActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  /** Entrée verrouillée : réservée à un palier supérieur au palier courant.
   *  Le clic mène à /plans plutôt qu'à la page. */
  const estVerrouille = (e: Icône) =>
    role === "proprietaire" && !!e.planRequis && !planSuffisant(planId ?? undefined, e.planRequis);
  const initiale = nom.trim()[0]?.toUpperCase() ?? "?";

  const badgePlan = (requis: PlanId) => (
    <span
      className="bg-primary-soft text-primary rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase"
      aria-hidden="true"
    >
      {requis}
    </span>
  );

  const icôneCadenas = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );

  return (
    <div className="bg-paper min-h-dvh">
      {/* Mobile : la sidebar n'existe pas par défaut, on l'affiche via un menu hamburger. */}
      <div className="lg:hidden">
        <header className="border-line bg-surface sticky top-0 z-30 border-b">
          <div className="mx-auto flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOuvert(true)}
                className="text-ink-3 hover:bg-sand hover:text-ink -ml-2 rounded-md p-2 transition-colors"
                aria-label="Ouvrir le menu"
              >
                {icône(<path d="M4 7h16M4 12h16M4 17h16" />)}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="text-ink font-semibold">{nom}</div>
                <div className="text-ink-3">{roleLabels[role]}</div>
              </div>
            </div>
          </div>
        </header>
        <nav className="border-line bg-surface sticky top-16 z-20 border-b">
          <div className="mx-auto flex gap-5 overflow-x-auto px-5 sm:px-8">
            {nav.map((e) => {
              const verrouille = estVerrouille(e);
              return (
                <Link
                  key={e.href}
                  href={verrouille ? "/plans" : e.href}
                  aria-label={verrouille ? `${e.label} — réservé au plan ${e.planRequis}` : undefined}
                  className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 py-3 text-sm font-medium no-underline transition-colors ${
                    estActive(e.href) && !verrouille
                      ? "border-primary text-ink"
                      : "text-ink-3 hover:text-ink border-transparent"
                  }`}
                >
                  {e.label}
                  {verrouille && (
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {icôneCadenas}
                      {badgePlan(e.planRequis!)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Overlay mobile */}
      {mobileOuvert && (
        <div
          className="bg-ink/40 fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOuvert(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar : pleine hauteur bureau, tiroir mobile. */}
      <aside
        className={`border-line bg-surface fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 ${
          mobileOuvert ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${ouvert ? "lg:w-60" : "lg:w-16"} lg:z-30`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b transition-opacity ${
            ouvert ? "justify-between px-4" : "justify-center"
          }`}
        >
          {ouvert ? (
            <Link href="/dashboard" className="flex items-center no-underline">
              <Logo />
            </Link>
          ) : (
            <Link href="/dashboard" aria-label="Immo" className="no-underline" title="Immo">
              <Logo compact />
            </Link>
          )}
          <button
            type="button"
            onClick={basculer}
            aria-label={ouvert ? "Replier la navigation" : "Déplier la navigation"}
            title={ouvert ? "Replier la navigation" : "Déplier la navigation"}
            className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors lg:block hidden"
          >
            {icône(<path d={ouvert ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />)}
          </button>
          <button
            type="button"
            onClick={() => setMobileOuvert(false)}
            className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-1.5 transition-colors lg:hidden"
            aria-label="Fermer le menu"
          >
            {icône(<path d="M6 18L18 6M6 6l12 12" />)}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" onClick={() => setMobileOuvert(false)}>
          {nav.map((e) => {
            const verrouille = estVerrouille(e);
            return (
              <Link
                key={e.href}
                href={verrouille ? "/plans" : e.href}
                aria-current={estActive(e.href) && !verrouille ? "page" : undefined}
                aria-label={
                  verrouille ? `${e.label} — réservé au plan ${e.planRequis}` : undefined
                }
                title={ouvert ? (verrouille ? `${e.label} — plan ${e.planRequis}` : undefined) : e.label}
                className={`relative rounded-md font-medium no-underline transition-colors ${
                  estActive(e.href) && !verrouille
                    ? "bg-sand text-ink"
                    : "text-ink-3 hover:bg-sand/60 hover:text-ink"
                } ${ouvert ? "flex items-center gap-3 px-3 py-2.5 text-sm" : "flex justify-center p-2.5"}`}
              >
                <span className="shrink-0">{e.icône}</span>
                {ouvert && (
                  <>
                    <span className="truncate">{e.label}</span>
                    {verrouille && (
                      <span className="ml-auto flex shrink-0 items-center gap-1.5" aria-hidden="true">
                        {icôneCadenas}
                        {badgePlan(e.planRequis!)}
                      </span>
                    )}
                  </>
                )}
                {!ouvert && verrouille && (
                  <span className="absolute grid size-4 place-items-center rounded-full bg-primary-soft text-primary">
                    {icôneCadenas}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Le plan est mis en avant, juste avant le profil : un clic mène au
            changement de palier. */}
        <div className="border-line shrink-0 border-t p-3">
          {plan && role === "proprietaire" && (
            <div className={ouvert ? "mb-2" : "mb-2 flex justify-center"}>
              {ouvert ? (
                <Link
                  href="/plans"
                  className="bg-sand text-ink hover:bg-sand/80 flex items-center gap-2.5 rounded-md px-3 py-2.5 no-underline transition-colors"
                  title="Changer de plan"
                >
                  <span className="text-primary shrink-0" aria-hidden="true">
                    {icône(<path d="m12 3 1.9 5.7a2 2 0 0 0 1.9 1.4H22l-4.9 3.6a2 2 0 0 0-.7 2.2l1.9 5.7-4.9-3.6a2 2 0 0 0-2.3 0l-4.9 3.6 1.9-5.7a2 2 0 0 0-.7-2.2L2 10.1h6.2a2 2 0 0 0 1.9-1.4z" />)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold">{plan.nom}</span>
                    <span className="text-ink-3 block truncate" data-numeric>
                      {plan.prixFcfa.toLocaleString("fr-FR")} F / mois
                    </span>
                  </span>
                  <span className="text-ink-3" aria-hidden="true">
                    →
                  </span>
                </Link>
              ) : (
                <Link
                  href="/plans"
                  aria-label={`Plan ${plan.nom} : changer de plan`}
                  title={`Plan ${plan.nom} : changer de plan`}
                  className="bg-sand text-primary hover:bg-sand/80 grid size-8 place-items-center rounded-md no-underline transition-colors"
                >
                  {icône(<path d="m12 3 1.9 5.7a2 2 0 0 0 1.9 1.4H22l-4.9 3.6a2 2 0 0 0-.7 2.2l1.9 5.7-4.9-3.6a2 2 0 0 0-2.3 0l-4.9 3.6 1.9-5.7a2 2 0 0 0-.7-2.2L2 10.1h6.2a2 2 0 0 0 1.9-1.4z" />)}
                </Link>
              )}
            </div>
          )}
          {ouvert ? (
            <div className="flex items-center gap-3">
              <Link href="/profil" className="flex min-w-0 flex-1 items-center gap-3 no-underline" title="Mon profil">
                <span
                  className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold"
                  aria-hidden="true"
                >
                  {initiale}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="text-ink block truncate font-semibold">{nom}</span>
                  <span className="text-ink-3 block truncate">{roleLabels[role]}</span>
                </span>
              </Link>
              <form action={logout} title="Se déconnecter">
                <button
                  type="submit"
                  aria-label="Se déconnecter"
                  className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-2 transition-colors"
                >
                  {icône(
                    <>
                      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
                      <path d="M16 8l4 4-4 4M20 12H9" />
                    </>,
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/profil"
                className="no-underline"
                title={`${nom} — ${roleLabels[role]} : Mon profil`}
                aria-label="Mon profil"
              >
                <span
                  className="bg-primary-soft text-primary grid size-9 place-items-center rounded-full text-sm font-bold"
                  aria-hidden="true"
                >
                  {initiale}
                </span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                  className="text-ink-3 hover:bg-sand hover:text-ink rounded-md p-2 transition-colors"
                >
                  {icône(
                    <>
                      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
                      <path d="M16 8l4 4-4 4M20 12H9" />
                    </>,
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${ouvert ? "lg:pl-60" : "lg:pl-16"}`}>
        <main className="mx-auto px-5 py-10 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
