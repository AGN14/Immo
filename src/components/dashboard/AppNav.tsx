"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const proprietaireLinks = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/biens", label: "Biens" },
  { href: "/locataires", label: "Locataires" },
  { href: "/loyers", label: "Loyers" },
  { href: "/versements", label: "Versements" },
  { href: "/signalements", label: "Signalements" },
];

export function AppNav({ role }: { role: "proprietaire" | "locataire" }) {
  const pathname = usePathname();

  if (role !== "proprietaire") return null;

  return (
    <nav className="border-line bg-surface border-b">
      <div className="mx-auto flex max-w-[1180px] gap-6 px-5 sm:px-8 lg:px-12">
        {proprietaireLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`-mb-px border-b-2 py-3 text-sm font-medium no-underline transition-colors ${
                active ? "border-primary text-ink" : "text-ink-3 hover:text-ink border-transparent"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
