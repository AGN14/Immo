"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { useReveal } from "@/components/ui/Reveal";

const steps = [
  {
    title: "Créez votre compte",
    body: "Propriétaire ou locataire, votre compte Xwégán est prêt en deux minutes, sans paperasse.",
  },
  {
    title: "Ajoutez ou rejoignez un bien",
    body: "Le propriétaire ajoute son bien et ses unités. Le locataire le rejoint avec un simple code.",
  },
  {
    title: "Gérez tout depuis Xwégán",
    body: "Loyers, pannes, quittances : au même endroit, à jour en permanence, des deux côtés.",
  },
];

/** Composant séparé : `useReveal` est un hook, il ne peut pas être appelé
 *  directement dans le `.map()` du parent. */
function Etape({
  numero,
  titre,
  corps,
  delayMs,
}: {
  numero: number;
  titre: string;
  corps: string;
  delayMs: number;
}) {
  const { ref, className: classesRevelation, style } = useReveal<HTMLLIElement>(delayMs);

  return (
    <li
      ref={ref}
      style={style}
      className={`${classesRevelation} border-line flex flex-col gap-2.5 border-t pt-5`}
    >
      <span className="font-display text-primary text-2xl font-semibold" data-numeric>
        {numero}
      </span>
      <h3 className="font-display text-ink text-xl font-semibold">{titre}</h3>
      <p className="text-ink-2 text-justify text-sm">{corps}</p>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="bg-sand py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Trois étapes, et c&rsquo;est en place
          </h2>
        </div>

        {/* Ici la numérotation est légitime : c'est une séquence, pas une liste. */}
        <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((s, i) => (
            <Etape key={s.title} numero={i + 1} titre={s.title} corps={s.body} delayMs={i * 80} />
          ))}
        </ol>
      </div>
    </section>
  );
}
