import { Eyebrow } from "@/components/ui/Eyebrow";

const ownerFeatures = [
  {
    title: "Qui a payé, qui doit, au franc près",
    body: "Bien par bien, mois par mois. Les arriérés remontent en tête, sans relance manuelle.",
    icon: <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />,
  },
  {
    title: "La quittance émise à la confirmation",
    body: "Numérotée, continue et sans trou — le document que réclame un dossier de logement ou un contrôle.",
    icon: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </>
    ),
  },
  {
    title: "L'amende de retard calculée toute seule",
    body: "Passé le 5, la pénalité s'ajoute au montant dû. Vous n'avez plus à la réclamer : elle est déjà au décompte.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
  },
  {
    title: "Le préavis quand le retard devient sérieux",
    body: "Au-delà du délai de tolérance, Xwégán signale que le congé est fondé. La décision reste la vôtre.",
    icon: (
      <>
        <path d="M6 21V4" />
        <path d="M6 4h12l-3 4 3 4H6" />
      </>
    ),
  },
  {
    title: "Les pannes remontées avec photos",
    body: "Centralisées, datées, avec leur priorité et leur statut de résolution.",
    icon: (
      <>
        <path d="M14.5 3.5 20.5 9.5 9 21H3v-6Z" />
        <path d="M13 5l6 6" />
      </>
    ),
  },
];

const tenantFeatures = [
  {
    title: "Payer par Mobile Money, depuis son téléphone",
    body: "À toute heure, sans déplacement et sans espèces à transporter.",
    icon: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" />
        <path d="M9 8.5l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Sa quittance, téléchargeable quand il veut",
    body: "Des mois plus tard, pour un dossier de logement ou un justificatif de domicile.",
    icon: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </>
    ),
  },
  {
    title: "Savoir ce qu'on doit, et pourquoi",
    body: "Le détail du mois, de l'amende s'il y en a une, et la date limite avant qu'elle ne s'applique.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </>
    ),
  },
  {
    title: "Signaler une panne en photo",
    body: "Montrer le problème au lieu de le décrire au téléphone. Et suivre où en est la réparation.",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <circle cx="12" cy="13.5" r="2.5" />
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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
    >
      {children}
    </svg>
  );
}

export function FeatureTracks() {
  return (
    <section id="fonctionnalites" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Une plateforme, deux expériences</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Pensé pour parler le langage de chacun
          </h2>
          <p className="text-ink-2">
            Le propriétaire pilote son parc comme une petite entreprise. Le locataire, lui, veut
            juste que ça marche en deux clics. Xwégán tient les deux promesses.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          {/* Panneau mis en avant (#eadbc0) : le côté propriétaire est celui qu'on souligne. */}
          <div className="bg-highlight border-line rounded-lg border p-6 md:p-8">
            <span className="text-primary text-sm font-semibold">Propriétaire</span>
            <h3 className="font-display text-ink mt-1 text-2xl font-semibold">
              Piloter son parc locatif
            </h3>
            <ul className="divide-line-soft border-line-soft mt-6 flex flex-col divide-y border-t">
              {ownerFeatures.map((f) => (
                <li key={f.title} className="flex gap-3.5 py-4">
                  <span className="text-primary mt-0.5 shrink-0">
                    <Icon>{f.icon}</Icon>
                  </span>
                  <div>
                    <h4 className="text-ink font-sans text-base font-semibold">{f.title}</h4>
                    <p className="text-ink-2 mt-1 text-sm">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-line bg-surface rounded-lg border p-6 md:p-8">
            <span className="text-ink-3 text-sm font-semibold">Locataire</span>
            <h3 className="font-display text-ink mt-1 text-2xl font-semibold">
              Gérer sa location au quotidien
            </h3>
            <ul className="divide-line border-line mt-6 flex flex-col divide-y border-t">
              {tenantFeatures.map((f) => (
                <li key={f.title} className="flex gap-3.5 py-4">
                  <span className="text-primary mt-0.5 shrink-0">
                    <Icon>{f.icon}</Icon>
                  </span>
                  <div>
                    <h4 className="text-ink font-sans text-base font-semibold">{f.title}</h4>
                    <p className="text-ink-2 mt-1 text-sm">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
