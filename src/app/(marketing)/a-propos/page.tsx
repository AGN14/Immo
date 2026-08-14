import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "À propos — Immo",
  description:
    "Pourquoi Immo existe : réunir propriétaires et locataires sur un registre commun, en FCFA, avec une trace de chaque loyer, panne et litige.",
};

const principes = [
  {
    titre: "Une seule source de vérité",
    corps:
      "Chaque bien, loyer, panne et litige vit à un endroit, visible des deux côtés. Personne n'a « sa » version des faits.",
  },
  {
    titre: "La trace avant la promesse",
    corps:
      "Un paiement horodaté, une panne datée avec ses photos, un litige documenté. Ce qui compte le jour d'un désaccord, c'est la preuve.",
  },
  {
    titre: "Le locataire ne paie jamais",
    corps:
      "L'accès locataire est gratuit et le restera. Un outil que seule une partie peut se permettre ne règle rien.",
  },
  {
    titre: "La langue du propriétaire, pas celle de la tech",
    corps:
      "Biens, locataires, loyers, travaux. Pas de jargon, pas de tableau de bord qu'il faut apprendre à lire.",
  },
];

export default function AProposPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <div className="mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex max-w-[42em] flex-col items-start gap-4">
            <Eyebrow>À propos</Eyebrow>
            <h1 className="font-display text-ink text-4xl font-semibold text-balance md:text-5xl">
              Un registre commun, plutôt qu&rsquo;un cahier et un groupe WhatsApp
            </h1>
            <p className="text-ink-2 text-lg">
              La gestion locative en Afrique de l&rsquo;Ouest tient souvent dans un cahier, une
              liasse de reçus et une conversation de groupe. Ça fonctionne — jusqu&rsquo;au jour où
              il faut prouver qui a payé quoi, ou retrouver quand une fuite a été signalée.
            </p>
            <p className="text-ink-2">
              Immo réunit le propriétaire et son locataire sur le même registre. Les loyers sont
              suivis à la FCFA près, les pannes remontent avec leurs photos, les litiges restent
              documentés. Chacun voit la même chose, au même moment.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="mx-auto px-5 sm:px-8 lg:px-12">
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Ce à quoi nous tenons
          </h2>
          <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
            {principes.map((p) => (
              <div key={p.titre} className="border-line flex flex-col gap-2 border-t pt-5">
                <dt className="font-display text-ink text-xl font-semibold">{p.titre}</dt>
                <dd className="text-ink-2 text-sm">{p.corps}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto px-5 sm:px-8 lg:px-12">
          <div className="border-line bg-surface flex max-w-[42em] flex-col items-start gap-4 rounded-lg border p-6 md:p-8">
            <h2 className="font-display text-ink text-2xl font-semibold">Où en est le produit</h2>
            <p className="text-ink-2 text-sm">
              Immo est en construction. Les biens, locataires et montants visibles sur ce site sont
              des données de démonstration, et les témoignages sont illustratifs : le produit
              n&rsquo;a pas encore de clients dont nous pourrions citer les mots. Nous préférons le
              dire plutôt que de gonfler des chiffres.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button href="/inscription" variant="primary">
                Créer un compte
              </Button>
              <Button href="/contact" variant="ghost">
                Nous écrire
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
