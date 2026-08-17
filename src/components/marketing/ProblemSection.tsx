"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useReveal } from "@/components/ui/Reveal";

const problems = [
  {
    title: "Le loyer payé, puis oublié",
    body: "Un cahier, une liasse de reçus, des messages WhatsApp éparpillés. Le jour où il faut prouver qui a payé quoi et quand, personne n'a la même version.",
  },
  {
    title: "La panne signalée dans le vide",
    body: "Un appel manqué, un message noyé dans une conversation de groupe : la fuite d'eau signalée un lundi attend toujours d'être vue trois semaines plus tard.",
  },
  {
    title: "Le retard qu'on n'ose pas réclamer",
    body: "Le 5 est passé, puis le 10. Réclamer, c'est risquer la brouille ; ne rien dire, c'est l'installer. Faute de règle écrite d'avance, c'est au bailleur de jouer le mauvais rôle, chaque mois.",
  },
];

/** Composant séparé : `useReveal` est un hook, il ne peut pas être appelé
 *  directement dans le `.map()` du parent. */
function CarteProbleme({
  titre,
  corps,
  delayMs,
}: {
  titre: string;
  corps: string;
  delayMs: number;
}) {
  const { ref, className: classesRevelation, style } = useReveal<HTMLElement>(delayMs, "box-shadow");

  return (
    <article
      ref={ref}
      style={style}
      className={`${classesRevelation} border-line bg-surface hover:shadow-md relative flex flex-col gap-2.5 border p-6 hover:z-10 md:-mr-px`}
    >
      <h3 className="font-display text-ink text-xl font-semibold">{titre}</h3>
      <p className="text-ink-2 text-justify text-sm">{corps}</p>
    </article>
  );
}

export function ProblemSection() {
  return (
    <section id="problemes" className="bg-sand py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Le quotidien sans Xwégán</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Trois frictions qui usent la relation propriétaire–locataire
          </h2>
          <p className="text-ink-2 text-justify">
            Ce ne sont pas de gros problèmes pris isolément. C&rsquo;est leur répétition, mois après
            mois, qui finit par créer la méfiance.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px md:grid-cols-3">
          {problems.map((p, i) => (
            <CarteProbleme key={p.title} titre={p.title} corps={p.body} delayMs={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
