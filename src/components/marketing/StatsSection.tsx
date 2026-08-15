import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/* Des faits produit vérifiables, pas des indicateurs de performance inventés. */
const engagements = [
  {
    valeur: "0 FCFA",
    libelle: "L'accès locataire, sans limite de durée ni de fonctionnalités.",
  },
  {
    valeur: "2 min",
    libelle: "Pour créer un compte, ajouter un bien et inviter son locataire.",
  },
  {
    valeur: "100 %",
    libelle: "Des paiements horodatés et tracés, consultables des deux côtés.",
  },
];

export function StatsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-5 sm:px-8 md:grid-cols-2 md:gap-16 lg:px-12">
        <div className="flex flex-col items-start gap-4">
          <Eyebrow>Conçu pour durer</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Pensé pour tenir la charge d&rsquo;un vrai parc locatif
          </h2>
          <p className="text-ink-2 max-w-[38em]">
            Xwégán n&rsquo;est pas un tableur qu&rsquo;on abandonne au bout d&rsquo;un mois. Chaque
            engagement ci-contre est tenu par le produit lui-même, pas par une promesse marketing.
          </p>
          <Button href="/#comment-ca-marche" variant="ghost" className="mt-2">
            Voir comment ça marche
            <ArrowRightIcon />
          </Button>
        </div>

        <dl className="border-line divide-line divide-y border-t border-b">
          {engagements.map((e) => (
            <div key={e.valeur} className="flex items-baseline gap-6 py-5">
              <dt
                className="font-display text-ink w-28 shrink-0 text-2xl font-semibold"
                data-numeric
              >
                {e.valeur}
              </dt>
              <dd className="text-ink-2 text-sm">{e.libelle}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
