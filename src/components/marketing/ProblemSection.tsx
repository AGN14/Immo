import { Eyebrow } from "@/components/ui/Eyebrow";

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
    title: "Le litige qui s'éternise",
    body: "Bruit, dégâts, retard de paiement entre colocataires : sans registre commun, chaque discussion repart de zéro et s'envenime un peu plus.",
  },
];

export function ProblemSection() {
  return (
    <section id="problemes" className="bg-sand py-16 md:py-24">
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Le quotidien sans Immo</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Trois frictions qui usent la relation propriétaire–locataire
          </h2>
          <p className="text-ink-2">
            Ce ne sont pas de gros problèmes pris isolément. C&rsquo;est leur répétition, mois après
            mois, qui finit par créer la méfiance.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px md:grid-cols-3">
          {problems.map((p) => (
            <article
              key={p.title}
              className="border-line bg-surface flex flex-col gap-2.5 border p-6 md:-mr-px"
            >
              <h3 className="font-display text-ink text-xl font-semibold">{p.title}</h3>
              <p className="text-ink-2 text-sm">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
