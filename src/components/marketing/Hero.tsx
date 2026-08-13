import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section className="px-0 py-[clamp(2.5rem,5vw,4.5rem)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-[clamp(2rem,5vw,4rem)] px-5 sm:px-8 md:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <Reveal className="flex flex-col gap-[1.4rem]">
          <Eyebrow>Gestion locative, sans friction</Eyebrow>
          <h1 className="font-display text-ink mt-2 text-[clamp(2.1rem,1.4rem+3vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-balance">
            Le loyer, les pannes et les litiges — enfin sous contrôle.
          </h1>
          <p className="text-ink-2 max-w-[40em] text-[clamp(1.02rem,0.96rem+0.3vw,1.15rem)]">
            Immo réunit propriétaires et locataires sur une seule plateforme : paiements suivis à la
            FCFA près, pannes signalées avec photos, litiges documentés, factures générées
            automatiquement. Fini le cahier, les appels perdus et le WhatsApp de l&rsquo;immeuble
            qui s&rsquo;enflamme.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <Button href="/inscription" variant="primary">
              Commencer gratuitement
              <ArrowRightIcon />
            </Button>
            <Button href="#demo" variant="ghost">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M10 8.5v7l6-3.5-6-3.5Z" />
              </svg>
              Voir la démo
            </Button>
          </div>
        </Reveal>

        <Reveal className="relative h-[clamp(320px,80vw,420px)] md:h-[clamp(360px,40vw,460px)]">
          <div className="border-line bg-surface absolute top-[6%] left-[4%] w-[84%] rounded-md border p-[1.4rem_1.4rem_1.6rem] shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[0.95rem] font-bold">Suivi des loyers — Résidence Baobab</span>
              <span className="text-ink-3 font-mono text-[0.72rem]">Août 2026</span>
            </div>

            <div className="flex items-center justify-between gap-3 py-[0.65rem]">
              <div className="flex items-center gap-[0.65rem]">
                <span className="bg-primary grid size-[30px] shrink-0 place-items-center rounded-full font-mono text-[0.68rem] font-semibold text-white">
                  AD
                </span>
                <div>
                  <div className="text-[0.82rem] font-bold">Aïssatou D.</div>
                  <div className="text-ink-3 text-[0.74rem]">Appt 3B</div>
                </div>
              </div>
              <span className="font-mono text-[0.8rem] font-semibold">85 000 F</span>
              <span className="rounded-pill bg-primary-soft text-primary-deep px-[0.7em] py-[0.3em] font-mono text-[0.68rem] font-semibold whitespace-nowrap">
                Payé
              </span>
            </div>

            <div className="border-line flex items-center justify-between gap-3 border-t py-[0.65rem]">
              <div className="flex items-center gap-[0.65rem]">
                <span className="bg-primary-hi grid size-[30px] shrink-0 place-items-center rounded-full font-mono text-[0.68rem] font-semibold text-white">
                  KY
                </span>
                <div>
                  <div className="text-[0.82rem] font-bold">Kouadio Y.</div>
                  <div className="text-ink-3 text-[0.74rem]">Appt 1A</div>
                </div>
              </div>
              <span className="font-mono text-[0.8rem] font-semibold">65 000 F</span>
              <span className="rounded-pill bg-coral-soft text-coral px-[0.7em] py-[0.3em] font-mono text-[0.68rem] font-semibold whitespace-nowrap">
                En retard
              </span>
            </div>

            <div className="border-line flex items-center justify-between gap-3 border-t py-[0.65rem]">
              <div className="flex items-center gap-[0.65rem]">
                <span className="bg-primary-deep grid size-[30px] shrink-0 place-items-center rounded-full font-mono text-[0.68rem] font-semibold text-white">
                  BF
                </span>
                <div>
                  <div className="text-[0.82rem] font-bold">Brice F.</div>
                  <div className="text-ink-3 text-[0.74rem]">Appt 2C</div>
                </div>
              </div>
              <span className="font-mono text-[0.8rem] font-semibold">92 000 F</span>
              <span className="rounded-pill bg-primary-soft text-primary-deep px-[0.7em] py-[0.3em] font-mono text-[0.68rem] font-semibold whitespace-nowrap">
                Payé
              </span>
            </div>
          </div>

          <div className="border-line bg-surface absolute top-[-4%] right-[-2%] w-[58%] rotate-3 rounded-md border p-4 shadow-md">
            <div className="flex items-center gap-[0.6rem]">
              <span className="bg-primary-soft text-primary grid size-[34px] shrink-0 place-items-center rounded-[10px]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[17px]"
                >
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <circle cx="12" cy="13.5" r="2.5" />
                </svg>
              </span>
              <div>
                <div className="text-[0.78rem] font-bold">Panne signalée</div>
                <div className="text-ink-3 text-[0.7rem]">Technicien en route</div>
              </div>
            </div>
          </div>

          <div className="bg-primary-deep absolute bottom-[2%] left-[-3%] w-[52%] -rotate-2 rounded-md p-[0.9rem_1.05rem] shadow-md">
            <div className="text-[0.7rem] font-semibold text-[#A9C9BE]">Loyer encaissé</div>
            <div className="mt-[0.15rem] font-mono text-[1.05rem] font-semibold text-white">
              + 85 000 FCFA
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
