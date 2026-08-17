"use client";

import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useReveal } from "@/components/ui/Reveal";
import { useCompteur } from "@/components/ui/useCompteur";

/* Des faits produit vérifiables, pas des indicateurs de performance inventés. */
const engagements = [
  {
    cible: 0,
    suffixe: "F",
    libelle: "L'accès locataire, sans limite de durée ni de fonctionnalités.",
  },
  {
    cible: 3,
    suffixe: "baux",
    libelle: "Gratuits, sans carte bancaire ni engagement.",
  },
  {
    cible: 24,
    suffixe: "h/24",
    libelle: "Le locataire paie quand il peut, pas quand vous êtes disponible.",
  },
];

function LigneEngagement({
  cible,
  suffixe,
  libelle,
  delayMs,
}: {
  cible: number;
  suffixe: string;
  libelle: string;
  delayMs: number;
}) {
  const { ref, className, style, visible } = useReveal<HTMLDivElement>(delayMs);
  const valeur = useCompteur(cible, visible);

  return (
    <div ref={ref} style={style} className={`${className} flex items-baseline gap-6 py-5`}>
      <dt className="font-display text-ink w-28 shrink-0 text-2xl font-semibold" data-numeric>
        {valeur} {suffixe}
      </dt>
      <dd className="text-ink-2 text-sm">{libelle}</dd>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-5 sm:px-8 md:grid-cols-2 md:gap-16 lg:px-12">
        <div className="flex flex-col items-start gap-4">
          <Eyebrow>Conçu pour durer</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Pensé pour tenir la charge d&rsquo;un vrai parc locatif
          </h2>
          <p className="text-ink-2 text-justify max-w-[38em]">
            Xwégán n&rsquo;est pas un tableur qu&rsquo;on abandonne au bout d&rsquo;un mois. Chaque
            engagement ci-contre est tenu par le produit lui-même, pas par une promesse marketing.
          </p>
          <Button href="/#comment-ca-marche" variant="ghost" className="mt-2">
            Voir comment ça marche
            <ArrowRightIcon />
          </Button>
        </div>

        <dl className="border-line divide-line divide-y border-t border-b">
          {engagements.map((e, i) => (
            <LigneEngagement
              key={e.suffixe}
              cible={e.cible}
              suffixe={e.suffixe}
              libelle={e.libelle}
              delayMs={i * 80}
            />
          ))}
        </dl>
      </div>
    </section>
  );
}
