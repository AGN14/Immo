"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useCompteur } from "@/components/ui/useCompteur";
import PlaceAmazone_immo from "@/assets/PlaceAmazone_immo.png";

const confiance = [
  { cible: 0, suffixe: "F", libelle: "accès locataire, à vie" },
  { cible: 3, suffixe: "baux", libelle: "gratuits, sans carte bancaire" },
  { cible: 24, suffixe: "h/24", libelle: "paiement par Mobile Money" },
];

/** Composant séparé : `useCompteur` est un hook, il ne peut pas être appelé
 *  directement dans le `.map()` du parent. Actif dès le montage — le Hero
 *  est visible dès le chargement, pas besoin d'attendre un défilement. */
function ChiffreConfiance({
  cible,
  suffixe,
  libelle,
}: {
  cible: number;
  suffixe: string;
  libelle: string;
}) {
  const valeur = useCompteur(cible, true);

  return (
    <div className="flex items-baseline gap-2 px-6 py-5 lg:px-10">
      <span className="font-display text-primary text-2xl font-semibold" data-numeric>
        {valeur} {suffixe}
      </span>
      <span className="text-ink-3 text-sm">{libelle}</span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start gap-5">
            <Eyebrow>Gestion locative · Bénin</Eyebrow>
            <h1 className="font-display text-ink max-w-xl text-4xl font-bold text-balance md:text-5xl">
              Le loyer rentre, la quittance part. Sans cahier, sans rappel.
            </h1>
            <p className="text-ink-2 max-w-md text-base">
              Xwégán réunit le propriétaire et son locataire sur un même registre. Le locataire
              paie par Mobile Money depuis son téléphone&nbsp;; sa quittance numérotée est émise
              dans la seconde. Vous savez qui a payé, qui doit, et combien, au franc près.
            </p>
            <Button href="/inscription" variant="primary">
              Commencer gratuitement
            </Button>
          </div>

          <div className="relative">
            <div className="border-line bg-surface relative aspect-[4/3] w-full overflow-hidden rounded-lg border shadow-md">
              <Image
                src={PlaceAmazone_immo}
                alt="Place de l'Amazone, Cotonou"
                fill
                className="object-cover"
                priority
              />

              <Link
                href="/#comment-ca-marche"
                aria-label="Comment ça marche"
                className="bg-surface text-ink hover:bg-sand absolute right-4 bottom-4 flex size-11 shrink-0 items-center justify-center rounded-full shadow-md transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-line bg-surface divide-line mt-10 grid grid-cols-1 divide-y rounded-lg border shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {confiance.map((c) => (
            <ChiffreConfiance
              key={c.suffixe}
              cible={c.cible}
              suffixe={c.suffixe}
              libelle={c.libelle}
            />
          ))}
        </div>

        <p className="text-ink-3 mt-4 text-sm">
          Gratuit jusqu&rsquo;à trois baux. L&rsquo;accès locataire est gratuit, sans limite de
          durée.
        </p>
      </div>
    </section>
  );
}
