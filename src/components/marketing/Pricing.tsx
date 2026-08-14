import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 size-4 shrink-0"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

/**
 * Les limites viennent de PLANS : la grille affichée et le quota appliqué dans
 * l'app ne peuvent pas diverger.
 */
const limite = (max: number | null) =>
  max === null ? "Logements loués illimités" : `Jusqu'à ${max} logements loués`;

const offres = [
  {
    plan: PLANS.essentiel,
    desc: "Pour suivre vos premiers logements, sans carte bancaire.",
    autres: ["Suivi des loyers", "Signalements de pannes", "Vos locataires ne paient jamais"],
    cta: "Commencer gratuitement",
    href: "/inscription/proprietaire",
    variant: "ghost" as const,
    misEnAvant: false,
  },
  {
    plan: PLANS.pro,
    desc: "Pour les propriétaires qui vivent de leurs biens.",
    autres: ["Facturation automatique", "Plan comptable mensuel", "Support prioritaire"],
    cta: "Passer en Pro",
    href: "/inscription/proprietaire?plan=pro",
    variant: "primary" as const,
    misEnAvant: true,
  },
  {
    plan: PLANS.business,
    desc: "Pour les portefeuilles multi-biens et les équipes.",
    autres: [
      "Multi-utilisateurs / gestionnaires",
      "Gestion avancée des litiges",
      "Exports comptables",
    ],
    cta: "Contacter l'équipe",
    href: "mailto:bonjour@immo.app?subject=Offre%20Business",
    variant: "ghost" as const,
    misEnAvant: false,
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="bg-sand py-16 md:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Tarification</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Vous ne payez que sur ce qui vous rapporte
          </h2>
          <p className="text-ink-2">
            Le palier dépend du nombre de{" "}
            <strong className="text-ink font-semibold">logements loués</strong> — un logement vacant
            ne compte pas, et un départ libère la place.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {offres.map((o) => (
            <div
              key={o.plan.id}
              className={`border-line flex flex-col gap-6 rounded-lg border p-6 ${
                o.misEnAvant ? "bg-highlight shadow-sm" : "bg-surface"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-ink text-lg font-semibold">{o.plan.nom}</span>
                  {o.misEnAvant && (
                    <span className="bg-primary text-on-primary rounded-sm px-2 py-0.5 text-xs font-semibold">
                      Recommandé
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-primary text-4xl font-semibold" data-numeric>
                    {o.plan.prixFcfa.toLocaleString("fr-FR")}
                  </span>
                  <span className="text-ink-3 text-sm">FCFA / mois</span>
                </div>
                <p className="text-ink-2 text-sm">{o.desc}</p>
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-primary">
                    <Check />
                  </span>
                  <strong className="text-ink font-semibold">{limite(o.plan.maxBaux)}</strong>
                </li>
                {o.autres.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="text-primary">
                      <Check />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button href={o.href} variant={o.variant} block>
                {o.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="border-line bg-surface text-ink-2 mt-6 rounded-md border p-4 text-sm">
          <strong className="text-ink font-semibold">
            L&rsquo;accès locataire est et restera toujours gratuit.
          </strong>{" "}
          Vos locataires ne sont jamais comptés dans votre palier, quel que soit leur nombre.
        </p>
      </div>
    </section>
  );
}
