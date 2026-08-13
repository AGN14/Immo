import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[0.1rem] size-[18px] shrink-0"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

const plans = [
  {
    tier: "Gratuit",
    amount: "0 FCFA",
    desc: "Pour tester Immo sur un premier bien.",
    features: [
      "1 bien géré",
      "Suivi des loyers de base",
      "Signalements de pannes",
      "Accès locataire illimité",
    ],
    cta: "Commencer gratuitement",
    variant: "ghost" as const,
    pro: false,
  },
  {
    tier: "★ Le plus choisi",
    amount: "5 000 FCFA",
    desc: "Pour les propriétaires qui vivent de leurs biens.",
    features: [
      "Biens illimités",
      "Facturation automatique",
      "Plan comptable mensuel",
      "Support prioritaire",
    ],
    cta: "Passer en Pro",
    variant: "on-dark" as const,
    pro: true,
  },
  {
    tier: "Business",
    amount: "15 000 FCFA",
    desc: "Pour les portefeuilles multi-biens et les équipes.",
    features: [
      "Tout Pro, sans limite",
      "Multi-utilisateurs / gestionnaires",
      "Gestion avancée des litiges",
      "Exports comptables",
    ],
    cta: "Contacter l'équipe",
    variant: "ghost" as const,
    pro: false,
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="bg-lilac py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="mb-[clamp(2rem,4vw,3rem)] flex max-w-[46em] flex-col gap-[0.9rem]">
          <Eyebrow>Tarification</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Un abonnement pensé pour les propriétaires
          </h2>
          <p className="text-ink-2 max-w-[40em] text-[clamp(1.02rem,0.96rem+0.3vw,1.15rem)]">
            Le locataire, lui, n&rsquo;a jamais rien à payer pour utiliser Immo.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-stretch gap-[1.4rem] md:grid-cols-3">
          {plans.map((p) => (
            <Reveal
              key={p.tier}
              className={`flex flex-col gap-[1.4rem] rounded-lg p-[1.9rem] ${
                p.pro
                  ? "bg-primary-deep text-white shadow-md md:-translate-y-2"
                  : "border-line bg-surface border"
              }`}
            >
              <div className="flex flex-col gap-2">
                <span
                  className={`font-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase ${
                    p.pro
                      ? "text-[#A9C9BE]"
                      : p.tier.startsWith("★")
                        ? "text-primary-deep"
                        : "text-ink-3"
                  }`}
                >
                  {p.tier}
                </span>
                <div className="font-display flex items-baseline gap-[0.35rem] text-[2.1rem] font-bold">
                  {p.amount}
                  <span
                    className={`font-mono text-[0.78rem] font-medium ${p.pro ? "text-[#A9C9BE]" : "text-ink-3"}`}
                  >
                    / mois
                  </span>
                </div>
                <p className={`text-[0.86rem] ${p.pro ? "text-[#A9C9BE]" : "text-ink-2"}`}>
                  {p.desc}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-[0.7rem]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-[0.6rem] text-[0.88rem]">
                    <span className={p.pro ? "text-white" : "text-primary"}>
                      <Check />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button href="#top" variant={p.variant} block>
                {p.cta}
              </Button>
            </Reveal>
          ))}
        </div>

        <div className="mt-9 flex justify-center">
          <Reveal>
            <p className="rounded-pill border-line bg-surface text-ink-2 inline-flex items-center gap-2 border px-[1.4rem] py-[0.8rem] text-center text-[0.9rem]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5l3 2" />
              </svg>
              <span>
                <strong className="text-ink">
                  L&rsquo;accès locataire est et restera toujours gratuit.
                </strong>{" "}
                Seuls les propriétaires choisissent un abonnement.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
