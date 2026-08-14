import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

const lots = [
  { nom: "Aïssatou Diallo", unite: "Appt 3B", montant: "85 000", statut: "Payé", ok: true },
  { nom: "Kouadio Yves", unite: "Appt 1A", montant: "65 000", statut: "En retard", ok: false },
  { nom: "Brice Fotso", unite: "Appt 2C", montant: "92 000", statut: "Payé", ok: true },
];

export function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid grid-cols-1 items-center gap-12 px-5 sm:px-8 md:grid-cols-[1fr_1fr] lg:gap-16 lg:px-12">
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

        {/* Un seul panneau, droit et aligné — pas un collage de cartes flottantes. */}
        <div className="border-line bg-surface rounded-lg border shadow-md">
          <div className="border-line flex items-baseline justify-between border-b px-5 py-4">
            <h2 className="font-display text-ink text-lg font-semibold">Suivi des loyers</h2>
            <span className="text-ink-3 text-sm">Août 2026</span>
          </div>

          <div className="border-line border-b px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-2 text-sm">Résidence Baobab — 3 lots</span>
              <span className="text-primary text-sm font-semibold" data-numeric>
                242 000 / 307 000 F
              </span>
            </div>
            <div className="bg-sand rounded-pill mt-2.5 h-1.5 w-full overflow-hidden">
              <div className="bg-primary rounded-pill h-full" style={{ width: "79%" }} />
            </div>
          </div>

          <ul>
            {lots.map((l) => (
              <li
                key={l.unite}
                className="border-line flex items-center justify-between gap-4 border-b px-5 py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-ink truncate text-sm font-semibold">{l.nom}</div>
                  <div className="text-ink-3 text-sm">{l.unite}</div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-primary text-sm font-semibold" data-numeric>
                    {l.montant} F
                  </span>
                  <span
                    className={`w-20 rounded-sm px-2 py-0.5 text-center text-xs font-semibold ${
                      l.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}
                  >
                    {l.statut}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
