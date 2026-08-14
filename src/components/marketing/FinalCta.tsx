import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section id="demo" className="py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <div className="bg-panel text-on-primary flex flex-col items-start gap-6 rounded-lg p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-on-primary max-w-[16em] text-3xl font-semibold text-balance">
              Gérez votre location sans prise de tête
            </h2>
            <p className="text-panel-muted max-w-[34em] text-sm">
              Propriétaire ou locataire, votre espace est prêt en deux minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button href="/inscription/proprietaire" variant="on-dark">
              Je suis propriétaire
              <ArrowRightIcon />
            </Button>
            <Button href="/inscription/locataire" variant="outline-on-dark">
              Je suis locataire
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
