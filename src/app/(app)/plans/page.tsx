import { requireProprietaire } from "@/lib/auth/mock-session";
import { choisirPlan } from "@/lib/actions/plans";
import { supabaseServer } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/plans";

export const metadata = { title: "Choisir votre plan" };

type LignePlan = {
  id: string;
  /** L'identifiant applicatif (« pro »). `id` est un UUID depuis plan_uuid. */
  slug: string;
  nom: string;
  prix_fcfa: number;
  description: string | null;
  fonctionnalites: unknown;
  max_baux: number | null;
};

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export default async function PlansPage() {
  const { plan: planActuel } = await requireProprietaire();

  const { data } = await supabaseServer()
    .from("plan")
    .select("id, slug, nom, prix_fcfa, description, fonctionnalites, max_baux")
    .order("prix_fcfa", { ascending: true });

  // max_baux vient de la base : le dupliquer ici le ferait diverger du quota
  // réellement appliqué par le trigger.
  const plans = (data ?? []) as LignePlan[];

  return (
    <div>
      <div className="max-w-[42em]">
        <h1 className="font-display text-ink text-3xl font-semibold">
          Votre compte est prêt — choisissez votre palier
        </h1>
        <p className="text-ink-2 mt-3 leading-relaxed">
          Vous payez uniquement sur ce qui vous rapporte : le palier dépend du nombre de{" "}
          <strong className="text-ink font-semibold">logements loués</strong>. Un logement vacant ne
          compte pas, et vous pouvez changer de palier à tout moment.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const fonctionnalites = Array.isArray(plan.fonctionnalites)
            ? (plan.fonctionnalites as string[])
            : [];
          // Comparaison sur le slug : `plan.id` est un UUID, `planActuel` un
          // identifiant applicatif — l'égalité n'aurait jamais été vraie.
          const estActuel = plan.slug === planActuel;
          const misEnAvant = plan.slug === "pro";

          return (
            <div
              key={plan.id}
              className={`border-line flex flex-col gap-6 rounded-lg border p-6 ${
                estActuel
                  ? "border-primary bg-highlight"
                  : misEnAvant
                    ? "bg-highlight"
                    : "bg-surface"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-ink text-lg font-semibold">{plan.nom}</span>
                  {estActuel ? (
                    <span className="bg-primary text-on-primary rounded-sm px-2 py-0.5 text-xs font-semibold">
                      Votre palier
                    </span>
                  ) : misEnAvant ? (
                    <span className="bg-primary text-on-primary rounded-sm px-2 py-0.5 text-xs font-semibold">
                      Recommandé
                    </span>
                  ) : null}
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

              {estActuel ? (
                <a
                  href="/dashboard"
                  className="border-line text-ink block w-full rounded-md border px-4 py-2.5 text-center text-sm font-semibold no-underline transition-colors"
                >
                  Aller au tableau de bord
                </a>
              ) : (
                <form action={choisirPlan} className="w-full">
                  {/* Le slug, pas l'UUID : choisirPlan valide contre PLANS et
                  reconvertit lui-même vers l'identifiant de la base. */}
                  <input type="hidden" name="plan" value={plan.slug} />
                  <button
                    type="submit"
                    className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                      misEnAvant
                        ? "bg-primary text-on-primary hover:bg-primary-hi shadow-cta"
                        : "border-line text-ink hover:border-ink-3 border"
                    }`}
                  >
                    Choisir {plan.nom}
                  </button>
                </form>
              )}
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
  );
}
