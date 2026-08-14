import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { supabaseServer } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

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

type LignePlan = {
  id: string;
  /** L'identifiant applicatif (« pro »). Depuis la migration plan_uuid, `id`
   *  est un UUID et c'est `slug` qui porte le sens. */
  slug: string;
  nom: string;
  prix_fcfa: number;
  description: string | null;
  fonctionnalites: unknown;
  max_baux: number | null;
};

type Cta = { label: string; href: string; variant: "ghost" | "primary" };

/**
 * L'appel à l'action ne peut pas venir de la base : il n'y a pas de colonne
 * pour ça. On garde donc une table locale — mais un palier inconnu doit
 * retomber sur un lien générique, pas faire tomber la page d'accueil.
 */
const cta: Record<PlanId, Cta> = {
  essentiel: {
    label: "Commencer gratuitement",
    href: "/inscription/proprietaire",
    variant: "ghost",
  },
  pro: { label: "Passer en Pro", href: "/inscription/proprietaire?plan=pro", variant: "primary" },
  business: {
    label: "Passer en Business",
    href: "/inscription/proprietaire?plan=business",
    variant: "primary",
  },
};

/**
 * La grille est lue depuis la table `plan` : la description et les
 * fonctionnalités affichées ici sont exactement celles de la page de choix
 * après l'inscription. Le quota est défendu en base par le trigger.
 */
export async function Pricing() {
  const { data } = await supabaseServer()
    .from("plan")
    .select("id, slug, nom, prix_fcfa, description, fonctionnalites, max_baux")
    .order("prix_fcfa", { ascending: true });

  const plans = (data ?? []) as LignePlan[];

  return (
    <section id="tarifs" className="bg-sand py-16 md:py-24">
      <div className="mx-auto px-5 sm:px-8 lg:px-12">
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
          {plans.map((plan) => {
            const fonctionnalites = Array.isArray(plan.fonctionnalites)
              ? (plan.fonctionnalites as string[])
              : [];
            // On indexe sur le slug, pas sur l'id : depuis la migration
            // plan_uuid, `id` est un UUID et ne correspondrait à aucune clé.
            // Un palier ajouté en SQL sans être déclaré ici ne doit pas casser
            // la page, juste s'afficher sobrement.
            const bouton: Cta = cta[plan.slug as PlanId] ?? {
              label: `Choisir ${plan.nom}`,
              href: "/inscription/proprietaire",
              variant: "ghost",
            };
            const misEnAvant = plan.slug === "pro";

            return (
              <div
                key={plan.id}
                className={`border-line flex flex-col gap-6 rounded-lg border p-6 ${
                  misEnAvant ? "bg-highlight shadow-sm" : "bg-surface"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-ink text-lg font-semibold">{plan.nom}</span>
                    {misEnAvant && (
                      <span className="bg-primary text-on-primary rounded-sm px-2 py-0.5 text-xs font-semibold">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-primary text-4xl font-semibold" data-numeric>
                      {plan.prix_fcfa.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-ink-3 text-sm">FCFA / mois</span>
                  </div>
                  <p className="text-ink-2 text-sm">{plan.description}</p>
                </div>

                <ul className="flex flex-1 flex-col gap-2.5 text-sm">
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary">
                      <Check />
                    </span>
                    <strong className="text-ink font-semibold">
                      {plan.max_baux === null
                        ? "Logements loués illimités"
                        : `Jusqu'à ${plan.max_baux} logements loués`}
                    </strong>
                  </li>
                  {fonctionnalites.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="text-primary">
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button href={bouton.href} variant={bouton.variant} block>
                  {bouton.label}
                </Button>
              </div>
            );
          })}
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
