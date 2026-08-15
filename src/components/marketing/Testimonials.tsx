import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function Testimonials() {
  return (
    <section id="temoignages" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Ce que Xwégán remplace</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Le cahier, la liasse de reçus, le groupe WhatsApp
          </h2>
          <p className="text-ink-2">
            Xwégán est jeune, et nous préférons le dire plutôt que d&rsquo;inventer des
            témoignages. Ce que nous connaissons en revanche, c&rsquo;est ce qu&rsquo;il remplace :
            un cahier qu&rsquo;on recopie, des reçus qui se perdent, et une conversation de groupe
            où personne n&rsquo;a la même version. Essayez sur un bien — trois baux sont gratuits,
            et vous nous direz.
          </p>
          <Button href="/inscription" variant="primary" className="mt-2">
            Essayer gratuitement
          </Button>
        </div>
      </div>
    </section>
  );
}
