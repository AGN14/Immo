import Link from "next/link";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-lilac pt-[clamp(2.5rem,5vw,3.5rem)] pb-[1.6rem]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <div className="border-line flex flex-wrap justify-between gap-10 border-b pb-8">
          <div className="flex max-w-[22em] flex-col gap-[0.9rem]">
            <Link href="#top" className="flex items-center gap-[0.65rem] no-underline">
              <Logo />
            </Link>
            <p className="text-ink-2 text-[0.9rem]">
              La plateforme qui relie propriétaires et locataires — loyers, pannes et litiges, sans
              prise de tête.
            </p>
            <div className="flex gap-[0.6rem]">
              <a
                href="#"
                aria-label="X"
                className="border-line bg-surface grid size-9 place-items-center rounded-full border"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="size-4"
                >
                  <path d="M4 4l16 16M20 4 4 20" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="border-line bg-surface grid size-9 place-items-center rounded-full border"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <rect x="4" y="9" width="3" height="10" />
                  <circle cx="5.5" cy="5.5" r="1.5" />
                  <path d="M11 19v-6a3 3 0 0 1 6 0v6M11 19v-10" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="border-line bg-surface grid size-9 place-items-center rounded-full border"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <rect x="4" y="4" width="16" height="16" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="16.5" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-[clamp(2rem,5vw,4rem)]">
            <div>
              <h4 className="text-ink-3 mb-[0.9rem] font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Produit
              </h4>
              <ul className="flex flex-col gap-[0.65rem]">
                <li>
                  <a
                    href="#fonctionnalites"
                    className="text-ink hover:text-primary text-[0.9rem] no-underline"
                  >
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a
                    href="#comment-ca-marche"
                    className="text-ink hover:text-primary text-[0.9rem] no-underline"
                  >
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a
                    href="#tarifs"
                    className="text-ink hover:text-primary text-[0.9rem] no-underline"
                  >
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-ink-3 mb-[0.9rem] font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
                Immo
              </h4>
              <ul className="flex flex-col gap-[0.65rem]">
                <li>
                  <a
                    href="#temoignages"
                    className="text-ink hover:text-primary text-[0.9rem] no-underline"
                  >
                    Témoignages
                  </a>
                </li>
                <li>
                  <a href="#top" className="text-ink hover:text-primary text-[0.9rem] no-underline">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#top" className="text-ink hover:text-primary text-[0.9rem] no-underline">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex max-w-[22em] flex-col gap-[0.6rem]">
            <h4 className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase">
              Newsletter
            </h4>
            <p className="text-ink-2 text-[0.86rem]">
              Un e-mail par mois : nouveautés produit, rien d&rsquo;autre.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="text-ink-3 flex flex-wrap items-center justify-between gap-4 pt-[1.4rem] text-[0.82rem]">
          <span>© 2026 Immo. Tous droits réservés.</span>
          <span>Fait avec fierté en Afrique</span>
        </div>
      </div>
    </footer>
  );
}
