import Link from "next/link";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Logo } from "@/components/ui/Logo";

/* Ancres absolues : la colonne « Produit » doit fonctionner depuis /a-propos et /contact. */
const columns = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#comment-ca-marche", label: "Comment ça marche" },
      { href: "/#tarifs", label: "Tarifs" },
    ],
  },
  {
    title: "Xwégán",
    links: [
      { href: "/#temoignages", label: "Témoignages" },
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/cookies", label: "Cookies" },
      { href: "/conditions-utilisation", label: "Conditions d'utilisation" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-line border-t py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex max-w-[22em] flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <Logo />
            </Link>
            <p className="text-ink-2 text-sm">
              La plateforme qui relie propriétaires et locataires : loyers, pannes et litiges, sans
              prise de tête.
            </p>
          </div>

          <div className="flex flex-wrap gap-12">
            {columns.map((c) => (
              <div key={c.title}>
                <h3 className="text-ink font-sans text-sm font-semibold">{c.title}</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-ink-2 hover:text-ink text-sm no-underline transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex max-w-[22em] flex-col gap-2">
            <h3 className="text-ink font-sans text-sm font-semibold">Newsletter</h3>
            <p className="text-ink-2 text-sm">
              Un e-mail par mois : nouveautés produit, rien d&rsquo;autre.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-line text-ink-3 mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm">
          <span>© 2026 Xwégán. Tous droits réservés.</span>
          <span>Fait en Afrique de l&rsquo;Ouest</span>
        </div>
      </div>
    </footer>
  );
}
