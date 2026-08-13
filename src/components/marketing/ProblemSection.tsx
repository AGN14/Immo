import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const problems = [
  {
    num: "01",
    title: "Le loyer payé... et oublié",
    body: "Un cahier, une liasse de reçus, des messages WhatsApp éparpillés. Le jour où il faut prouver qui a payé quoi et quand, personne n'a la même version.",
  },
  {
    num: "02",
    title: "La panne signalée dans le vide",
    body: "Un appel manqué, un message noyé dans une conversation de groupe : la fuite d'eau signalée un lundi attend toujours d'être vue trois semaines plus tard.",
  },
  {
    num: "03",
    title: "Le litige qui s'éternise",
    body: "Bruit, dégâts, retard de paiement entre colocataires : sans registre commun, chaque discussion repart de zéro et s'envenime un peu plus.",
  },
];

export function ProblemSection() {
  return (
    <section id="problemes" className="bg-lilac py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="mb-[clamp(2rem,4vw,3rem)] flex max-w-[46em] flex-col gap-[0.9rem]">
          <Eyebrow>Le quotidien sans Immo</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Trois frictions qui usent la relation propriétaire–locataire
          </h2>
          <p className="text-ink-2 max-w-[40em] text-[clamp(1.02rem,0.96rem+0.3vw,1.15rem)]">
            Ce ne sont pas de gros problèmes pris isolément. C&rsquo;est leur répétition, mois après
            mois, qui finit par créer la méfiance.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-[1.4rem] md:grid-cols-3">
          {problems.map((p) => (
            <Reveal
              key={p.num}
              className="border-line bg-surface flex flex-col gap-4 rounded-md border p-[1.8rem_1.7rem]"
            >
              <span className="text-ink-3 font-mono text-[0.8rem] font-semibold">{p.num}</span>
              <h3 className="font-display text-ink text-[1.12rem] leading-[1.3] font-bold">
                {p.title}
              </h3>
              <p className="text-ink-2 text-[0.94rem]">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
