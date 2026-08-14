"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/* Ancres absolues : ces liens doivent aussi fonctionner depuis /a-propos ou /contact,
   où les sections visées n'existent pas. */
const links = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#temoignages", label: "Témoignages" },
  { href: "/#tarifs", label: "Tarifs" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`bg-paper/90 sticky top-0 z-40 backdrop-blur-[8px] transition-colors duration-200 ${
        scrolled ? "border-line border-b" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Logo />
        </Link>

        <nav
          className={`border-line bg-paper fixed inset-x-0 top-[68px] flex flex-col items-start border-b px-5 pt-1 pb-5 transition-opacity duration-150 sm:px-8 lg:px-12 ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100"
          } md:static md:flex-row md:items-center md:gap-8 md:border-none md:bg-transparent md:p-0 md:opacity-100`}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-line text-ink-2 hover:text-ink w-full border-b py-3 text-sm font-medium no-underline transition-colors md:w-auto md:border-none md:py-0"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 flex w-full flex-col gap-2.5 md:hidden">
            <Button href="/connexion" variant="ghost" block>
              Se connecter
            </Button>
            <Button href="/inscription" variant="primary" block>
              Commencer gratuitement
            </Button>
          </div>
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:block">
            <Button href="/connexion" variant="ghost">
              Se connecter
            </Button>
          </span>
          <span className="hidden md:block">
            <Button href="/inscription" variant="primary">
              Commencer gratuitement
            </Button>
          </span>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="border-line bg-surface text-ink flex size-10 items-center justify-center rounded-md border md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="size-5"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
