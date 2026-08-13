import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const testimonials = [
  {
    quote:
      "Je gérais mes quatre appartements dans un cahier. Aujourd'hui je sais qui a payé avant même d'ouvrir Immo. Le plan comptable du mois, c'est ma comptable qui me remercie.",
    initials: "AD",
    colorClass: "bg-primary",
    name: "Aïssatou Diallo",
    role: "Propriétaire — Dakar, Sénégal",
  },
  {
    quote:
      "J'ai signalé une fuite avec deux photos un dimanche soir. Le lundi matin, le plombier était déjà prévenu. Avant, j'aurais rappelé trois fois pour rien.",
    initials: "KY",
    colorClass: "bg-primary-hi",
    name: "Kouadio Yves",
    role: "Locataire — Abidjan, Côte d'Ivoire",
  },
  {
    quote:
      "Deux locataires en désaccord sur le bruit, tout est resté documenté dans Immo au lieu de dégénérer sur le groupe WhatsApp de l'immeuble.",
    initials: "BF",
    colorClass: "bg-primary-deep",
    name: "Brice Fotso",
    role: "Propriétaire — Douala, Cameroun",
  },
];

export function Testimonials() {
  return (
    <section id="temoignages" className="py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8 lg:px-12">
        <Reveal className="mb-[clamp(2rem,4vw,3rem)] flex max-w-[46em] flex-col gap-[0.9rem]">
          <Eyebrow>Ils utilisent Immo</Eyebrow>
          <h2 className="font-display text-ink mt-1 text-[clamp(1.7rem,1.35rem+1.6vw,2.5rem)] leading-[1.1] font-bold tracking-tight text-balance">
            Ce que ça change, au quotidien
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-[1.4rem] md:grid-cols-3">
          {testimonials.map((t) => (
            <Reveal
              key={t.name}
              className="border-line bg-surface flex flex-col gap-[1.2rem] rounded-md border p-[1.8rem]"
            >
              <blockquote className="font-display text-ink text-[1.05rem] leading-[1.45]">
                &laquo;&nbsp;{t.quote}&nbsp;&raquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <span
                  className={`${t.colorClass} grid size-[42px] shrink-0 place-items-center rounded-full font-mono text-[0.85rem] font-semibold text-white`}
                >
                  {t.initials}
                </span>
                <div>
                  <div className="text-[0.92rem] font-bold">{t.name}</div>
                  <div className="text-ink-3 text-[0.78rem]">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
