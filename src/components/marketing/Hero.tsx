import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StatusPill } from "@/components/ui/StatusPill";
import Villa_immo from "@/assets/Villa_immo.jpg";

const confiance = [
  { valeur: "0 FCFA", libelle: "pour le premier bien" },
  { valeur: "2 min", libelle: "pour inviter un locataire" },
  { valeur: "100 %", libelle: "des paiements tracés" },
];

export function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="border-line bg-surface overflow-hidden rounded-lg border shadow-md">
          <div className="flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between lg:p-12">
            <div className="flex flex-col items-start gap-4">
              <Eyebrow>Gestion locative</Eyebrow>
              <h1 className="font-display text-ink max-w-xl text-4xl font-bold text-balance md:text-5xl">
                Le loyer, les pannes et les litiges, enfin sous contrôle.
              </h1>
            </div>
            <div className="flex flex-col items-start gap-4 md:max-w-xs md:items-end md:text-right">
              <p className="text-ink-2 text-base">
                Paiements suivis à la FCFA près, pannes signalées avec photos, litiges documentés,
                factures générées automatiquement.
              </p>
              <Button href="/inscription" variant="primary" className="md:self-end">
                Commencer gratuitement
              </Button>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
            <Image
              src={Villa_immo}
              alt="Résidence gérée sur Immo"
              fill
              className="object-cover"
              priority
            />
            <div className="from-panel/80 absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t via-transparent to-transparent" />

            <div className="bg-surface/95 absolute top-4 right-4 flex items-center gap-2 rounded-md px-3 py-2 shadow-md backdrop-blur-sm sm:top-6 sm:right-6">
              <span className="text-ink text-sm font-semibold whitespace-nowrap">Panne signalée</span>
              <StatusPill tone="warn">Technicien en route</StatusPill>
            </div>

            <div className="absolute right-4 bottom-4 left-4 flex flex-wrap items-end justify-between gap-4 sm:right-6 sm:bottom-6 sm:left-6">
              <div className="bg-surface/95 flex items-center gap-3 rounded-md px-4 py-3 shadow-md backdrop-blur-sm">
                <span className="bg-success-soft text-success flex size-9 shrink-0 items-center justify-center rounded-md">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <div className="text-ink-3 text-xs">Loyer encaissé</div>
                  <div className="text-ink text-sm font-semibold" data-numeric>
                    + 85 000 FCFA
                  </div>
                </div>
              </div>

              <Link
                href="/#demo"
                aria-label="Voir la démo"
                className="bg-surface text-ink hover:bg-sand flex size-11 shrink-0 items-center justify-center rounded-full shadow-md transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M10 8.5v7l6-3.5-6-3.5Z" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="border-line divide-line grid grid-cols-1 divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {confiance.map((c) => (
              <div key={c.valeur} className="flex items-baseline gap-2 px-6 py-5 lg:px-12">
                <span className="font-display text-primary text-2xl font-semibold" data-numeric>
                  {c.valeur}
                </span>
                <span className="text-ink-3 text-sm">{c.libelle}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-ink-3 mt-4 text-sm">
          Gratuit pour un premier bien. L&rsquo;accès locataire est toujours gratuit.
        </p>
      </div>
    </section>
  );
}
