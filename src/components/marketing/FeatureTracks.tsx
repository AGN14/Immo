import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const ownerFeatures = [
  {
    title: "Suivi des loyers en temps réel",
    body: "Qui a payé, qui est en retard, bien par bien — visible en un coup d'œil, sans relance manuelle.",
    icon: <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />,
  },
  {
    title: "Facturation automatique & plan comptable",
    body: "Une facture générée à chaque paiement, un récapitulatif comptable prêt chaque mois pour votre gestionnaire.",
    icon: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </>
    ),
  },
  {
    title: "Gestion des signalements de pannes",
    body: "Chaque panne remontée par vos locataires arrive centralisée, avec photos, priorité et statut de résolution.",
    icon: (
      <>
        <path d="M14.5 3.5 20.5 9.5 9 21H3v-6Z" />
        <path d="M13 5l6 6" />
      </>
    ),
  },
  {
    title: "Résolution des litiges entre locataires",
    body: "Un espace commun pour documenter, échanger des preuves et trancher — sans que tout retombe sur vous par téléphone.",
    icon: <path d="M12 3v18M6 7l-3 6a3.2 3.2 0 0 0 6 0ZM21 13a3.2 3.2 0 0 1-6 0l3-6ZM6 7h12" />,
  },
];

const tenantFeatures = [
  {
    title: "Paiement du loyer en ligne",
    body: "Payez en quelques secondes depuis votre téléphone, recevez votre reçu automatiquement.",
    icon: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" />
        <path d="M9 8.5l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Signalement de pannes avec photos",
    body: "Montrez le problème au lieu de le décrire au téléphone. Trois photos suffisent.",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <circle cx="12" cy="13.5" r="2.5" />
      </>
    ),
  },
  {
    title: "Suivi des réparations en direct",
    body: "Sachez exactement où en est votre demande — signalée, prise en charge, résolue — sans relancer personne.",
    icon: (
      <>
        <path d="M20 12a8 8 0 1 1-3-6.2" />
        <path d="M20 4v5h-5" />
      </>
    ),
  },
  {
    title: "Signalement de litiges en quelques clics",
    body: "Un désaccord avec un voisin ou le propriétaire ? Signalez-le et gardez une trace claire, datée.",
    icon: (
      <>
        <path d="M6 21V4" />
        <path d="M6 4h12l-3 4 3 4H6" />
      </>
    ),
  },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[19px]"
    >
      {children}
    </svg>
  );
}

export function FeatureTracks() {
  return (
    <section id="fonctionnalites" className="py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="mb-[clamp(2rem,4vw,3rem)] flex max-w-[46em] flex-col gap-[0.9rem]">
          <Eyebrow>Une plateforme, deux expériences</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Pensé pour parler le langage de chacun
          </h2>
          <p className="text-ink-2 max-w-[40em] text-[clamp(1.02rem,0.96rem+0.3vw,1.15rem)]">
            Le propriétaire pilote son parc comme une petite entreprise. Le locataire, lui, veut
            juste que ça marche en deux clics. Immo tient les deux promesses.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[1.6rem] md:grid-cols-2">
          <Reveal className="bg-primary-deep flex flex-col gap-[1.3rem] rounded-lg p-[clamp(1.6rem,3vw,2.2rem)] text-white">
            <div>
              <span className="font-mono text-[0.72rem] font-semibold tracking-[0.1em] text-[#A9C9BE] uppercase">
                Propriétaire
              </span>
              <h3 className="font-display text-[1.5rem] font-bold text-white">
                Piloter son parc locatif
              </h3>
            </div>
            {ownerFeatures.map((f) => (
              <div key={f.title} className="flex gap-[0.9rem] rounded-sm bg-white/7 p-4">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-white/14 text-white">
                  <Icon>{f.icon}</Icon>
                </span>
                <div>
                  <h4 className="mb-[0.3rem] font-sans text-[0.98rem] font-bold">{f.title}</h4>
                  <p className="text-[0.86rem] text-[#A9C9BE]">{f.body}</p>
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal className="border-line bg-surface flex flex-col gap-[1.3rem] rounded-lg border p-[clamp(1.6rem,3vw,2.2rem)]">
            <div>
              <span className="text-ink-3 font-mono text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                Locataire
              </span>
              <h3 className="font-display text-ink text-[1.5rem] font-bold">
                Gérer sa location au quotidien
              </h3>
            </div>
            {tenantFeatures.map((f) => (
              <div key={f.title} className="bg-lilac flex gap-[0.9rem] rounded-sm p-4">
                <span className="bg-surface text-primary grid size-[38px] shrink-0 place-items-center rounded-[11px]">
                  <Icon>{f.icon}</Icon>
                </span>
                <div>
                  <h4 className="text-ink mb-[0.3rem] font-sans text-[0.98rem] font-bold">
                    {f.title}
                  </h4>
                  <p className="text-ink-2 text-[0.86rem]">{f.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
