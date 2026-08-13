import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const stats = [
  { num: "72h", lbl: "délai moyen de résolution d'une panne signalée" },
  { num: "100%", lbl: "des paiements de loyer horodatés et tracés" },
  { num: "0 FCFA", lbl: "l'accès locataire, toujours gratuit" },
  { num: "3 étapes", lbl: "pour démarrer, sans formation ni paperasse" },
];

export function StatsSection() {
  return (
    <section className="py-[clamp(1rem,3vw,2rem)_clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-[clamp(2rem,5vw,4rem)] px-5 sm:px-8 md:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <Reveal className="flex flex-col gap-[1.1rem]">
          <Eyebrow>Conçu pour durer</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Pensé pour tenir la charge d&rsquo;un vrai parc locatif.
          </h2>
          <p className="text-ink-2 max-w-[40em] text-[clamp(1.02rem,0.96rem+0.3vw,1.15rem)]">
            Immo n&rsquo;est pas un tableur qu&rsquo;on abandonne au bout d&rsquo;un mois. Chaque
            chiffre ci-contre est une promesse tenue par le produit, pas un objectif marketing.
          </p>
          <Button href="#comment-ca-marche" variant="ghost" className="mt-2 w-fit">
            Voir comment ça marche
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </Reveal>

        <Reveal className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.num} className="border-line bg-surface rounded-md border p-[1.4rem_1.3rem]">
              <span className="text-primary block font-mono text-2xl font-semibold">{s.num}</span>
              <span className="text-ink-3 mt-[0.4rem] block text-[0.82rem] leading-[1.4]">
                {s.lbl}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
