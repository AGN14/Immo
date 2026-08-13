import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section id="demo" className="py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="bg-primary-deep flex flex-col items-center gap-[1.6rem] rounded-lg p-[clamp(2.5rem,6vw,4.5rem)] text-center text-white">
          <h2 className="font-display max-w-[20em] text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance text-white">
            Rejoins les propriétaires et locataires qui gèrent leur location sans prise de tête
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/inscription/proprietaire" variant="on-dark">
              Je suis propriétaire
              <ArrowRightIcon />
            </Button>
            <Button href="/inscription/locataire" variant="outline-on-dark">
              Je suis locataire
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
