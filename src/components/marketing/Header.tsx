"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#temoignages", label: "Témoignages" },
  { href: "#tarifs", label: "Tarifs" },
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
      className={`bg-paper/86 sticky top-0 z-40 backdrop-blur-[10px] transition-[border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-line border-b shadow-[0_8px_24px_rgba(32,27,61,0.06)]"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="#top" className="flex items-center gap-[0.65rem] no-underline">
          <span className="bg-primary grid size-[34px] shrink-0 place-items-center rounded-[10px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
            >
              <path d="M4 11.5 12 4l8 7.5" />
              <path d="M6 10v9h12v-9" />
              <path d="M10 19v-5h4v5" />
            </svg>
          </span>
          <span className="font-display text-ink text-[1.28rem] font-bold">Immo</span>
        </Link>

        <nav
          className={`border-line bg-paper fixed inset-x-0 top-[76px] flex flex-col items-start gap-0 border-b px-5 pt-2 pb-5 opacity-0 transition-[opacity,transform] duration-200 sm:px-8 lg:px-12 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          } md:pointer-events-auto md:static md:translate-y-0 md:flex-row md:items-center md:gap-[2.1rem] md:border-none md:bg-transparent md:p-0 md:opacity-100`}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-line text-ink-2 hover:text-ink w-full border-b py-[0.85rem] text-[0.92rem] font-semibold no-underline transition-colors md:w-auto md:border-none md:py-0"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-4 flex w-full flex-col gap-3 md:hidden">
            <Button href="#tarifs" variant="ghost" block>
              Se connecter
            </Button>
            <Button href="#tarifs" variant="primary" block>
              Commencer gratuitement
            </Button>
          </div>
        </nav>

        <div className="flex items-center gap-[0.9rem]">
          <span className="hidden md:block">
            <Button href="#tarifs" variant="ghost">
              Se connecter
            </Button>
          </span>
          <span className="hidden md:block">
            <Button href="#tarifs" variant="primary">
              Commencer gratuitement
            </Button>
          </span>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="border-line bg-surface flex size-[42px] items-center justify-center rounded-xl border md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
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
