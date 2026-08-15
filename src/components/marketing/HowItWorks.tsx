import { Eyebrow } from "@/components/ui/Eyebrow";

const steps = [
  {
    title: "Créez votre compte",
    body: "Propriétaire ou locataire, votre compte Xwégán est prêt en deux minutes, sans paperasse.",
  },
  {
    title: "Ajoutez ou rejoignez un bien",
    body: "Le propriétaire ajoute son bien et ses unités. Le locataire le rejoint avec un simple code.",
  },
  {
    title: "Gérez tout depuis Xwégán",
    body: "Loyers, pannes, quittances : au même endroit, à jour en permanence, des deux côtés.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="bg-sand py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex max-w-[42em] flex-col items-start gap-4">
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="font-display text-ink text-3xl font-semibold text-balance md:text-4xl">
            Trois étapes, et c&rsquo;est en place
          </h2>
        </div>

        {/* Ici la numérotation est légitime : c'est une séquence, pas une liste. */}
        <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((s, i) => (
            <li key={s.title} className="border-line flex flex-col gap-2.5 border-t pt-5">
              <span className="font-display text-primary text-2xl font-semibold" data-numeric>
                {i + 1}
              </span>
              <h3 className="font-display text-ink text-xl font-semibold">{s.title}</h3>
              <p className="text-ink-2 text-justify text-sm">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
