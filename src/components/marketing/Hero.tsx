import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import Image from 'next/image'

import Maison_immo from "../../assets/Maison_immo.jpeg";
export function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 md:grid-cols-2 lg:gap-16 lg:px-12">
        <div className="flex flex-col items-start gap-5">
          <Eyebrow>Gestion locative</Eyebrow>
          <h1 className="font-display text-ink text-4xl font-semibold text-balance md:text-5xl">
            Le loyer, les pannes et les litiges, enfin sous contrôle.
          </h1>
          <p className="text-ink-2 max-w-[36em] text-lg">
            Immo réunit propriétaires et locataires sur une seule plateforme : paiements suivis à la
            FCFA près, pannes signalées avec photos, litiges documentés, factures générées
            automatiquement.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button href="/inscription" variant="primary">
              Commencer gratuitement
              <ArrowRightIcon />
            </Button>
            <Button href="/#demo" variant="ghost">
              Voir la démo
            </Button>
          </div>
          <p className="text-ink-3 text-sm">
            Gratuit pour un premier bien. L&rsquo;accès locataire est toujours gratuit.
          </p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl lg:aspect-square">
          <Image
            src={Maison_immo}
            alt="Gestion immobilière"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
