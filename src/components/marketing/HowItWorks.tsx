import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const steps = [
  {
    num: "01",
    title: "Inscris-toi",
    body: "Propriétaire ou locataire, crée ton compte Immo en deux minutes, sans paperasse.",
  },
  {
    num: "02",
    title: "Ajoute ou rejoins ton bien",
    body: "Le propriétaire ajoute son bien et ses unités. Le locataire le rejoint avec un simple code.",
  },
  {
    num: "03",
    title: "Gère tout depuis Immo",
    body: "Loyers, pannes, litiges, factures : tout au même endroit, à jour en permanence, des deux côtés.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="bg-lilac py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="mb-[clamp(2rem,4vw,3rem)] flex max-w-[46em] flex-col gap-[0.9rem]">
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Trois étapes, et c&rsquo;est en place
          </h2>
        </Reveal>

        <div className="relative grid grid-cols-1 gap-[1.8rem] md:grid-cols-3 md:gap-[2.2rem]">
          <div className="bg-line absolute top-[1.65rem] right-[10%] left-[10%] hidden h-px md:block" />
          {steps.map((s) => (
            <Reveal key={s.num} className="relative flex flex-col gap-[0.9rem]">
              <span className="bg-lilac text-primary w-fit pr-[0.6rem] font-mono text-2xl font-semibold">
                {s.num}
              </span>
              <h3 className="font-display text-ink text-[1.1rem] leading-[1.3] font-bold">
                {s.title}
              </h3>
              <p className="text-ink-2 text-[0.92rem]">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
