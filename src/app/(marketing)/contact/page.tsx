import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Contact · Xwégán",
  description:
    "Écrire à l'équipe Xwégán : questions produit, offre Business pour les portefeuilles multi-biens, ou problème rencontré sur votre compte.",
};

const motifs = [
  {
    titre: "Une question sur le produit",
    corps:
      "Vous vous demandez si Xwégán couvre votre situation : plusieurs immeubles, colocation, gestion déléguée ?",
    adresse: "bonjour@immo.app",
    sujet: "Question produit",
  },
  {
    titre: "L'offre Business",
    corps:
      "Portefeuille multi-biens, plusieurs gestionnaires, exports comptables : nous en discutons directement.",
    adresse: "bonjour@immo.app",
    sujet: "Offre Business",
  },
  {
    titre: "Un problème sur votre compte",
    corps:
      "Un loyer qui ne remonte pas, une panne signalée qui n'apparaît pas : décrivez-nous ce que vous voyez.",
    adresse: "support@immo.app",
    sujet: "Problème sur mon compte",
  },
];

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="font-display text-ink text-4xl font-semibold text-balance md:text-5xl">
            Écrivez-nous
          </h1>
          <p className="text-ink-2 text-justify text-lg">
            Une adresse par sujet, pour que votre message arrive à la bonne personne du premier
            coup.
          </p>
        </div>

        <div className="mt-12 grid max-w-[52em] grid-cols-1 gap-4">
          {motifs.map((m) => (
            <a
              key={m.titre}
              href={`mailto:${m.adresse}?subject=${encodeURIComponent(m.sujet)}`}
              className="border-line bg-surface hover:border-primary hover:bg-highlight group flex flex-col gap-1.5 rounded-lg border p-6 no-underline transition-colors"
            >
              <h2 className="font-display text-ink text-xl font-semibold">{m.titre}</h2>
              <p className="text-ink-2 text-justify text-sm">{m.corps}</p>
              <span className="text-primary mt-2 text-sm font-semibold">{m.adresse} →</span>
            </a>
          ))}
        </div>

        <p className="text-ink-3 text-justify mt-10 max-w-[42em] text-sm">
          Xwégán est en construction : nous répondons nous-mêmes à chaque message, sans formulaire
          ni robot intermédiaire.
        </p>
      </div>
    </section>
  );
}
