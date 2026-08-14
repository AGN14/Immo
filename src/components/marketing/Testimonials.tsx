import { Eyebrow } from "@/components/ui/Eyebrow";

const testimonials = [
  {
    quote:
      "Je gérais mes quatre appartements dans un cahier. Aujourd'hui je sais qui a payé avant même d'ouvrir Immo. Le plan comptable du mois, c'est ma comptable qui me remercie.",
    name: "Aïssatou Diallo",
    role: "Propriétaire, Cotonou",
  },
  {
    quote:
      "J'ai signalé une fuite avec deux photos un dimanche soir. Le lundi matin, le plombier était déjà prévenu. Avant, j'aurais rappelé trois fois pour rien.",
    name: "Kouadio Yves",
    role: "Locataire, Abidjan",
  },
  {
    quote:
      "Deux locataires en désaccord sur le bruit, tout est resté documenté dans Immo au lieu de dégénérer sur le groupe WhatsApp de l'immeuble.",
    name: "Brice Fotso",
    role: "Propriétaire, Douala",
  },
];

export function Testimonials() {
  return (
    <section id="temoignages" className="py-16 md:py-24">
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Ils utilisent Immo</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Ce que ça change, au quotidien
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {testimonials.map((t) => (
            <figure key={t.name} className="border-line flex h-full flex-col gap-4 border-t pt-5">
              <blockquote className="font-display text-ink text-xl">
                &laquo;&nbsp;{t.quote}&nbsp;&raquo;
              </blockquote>
              {/* mt-auto : les attributions s'alignent en bas quelle que soit la longueur de la citation */}
              <figcaption className="mt-auto text-sm">
                <span className="text-ink block font-semibold">{t.name}</span>
                <span className="text-ink-3">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Le produit n'a pas encore de clients : on le dit au lieu de le masquer. */}
        <p className="text-ink-3 mt-10 text-xs">
          Témoignages illustratifs, représentatifs des usages visés par Immo.
        </p>
      </div>
    </section>
  );
}
