import { requireProprietaire } from "@/lib/auth/session";
import { choisirPlan } from "@/lib/actions/plans";
import { getProprietaireById } from "@/lib/data";
import { supabaseUtilisateur } from "@/lib/supabase/utilisateur";
import { kkiapayConfigure } from "@/lib/paiement/kkiapay";
import { BoutonPalier, PaiementAbonnement } from "@/app/(app)/plans/PaiementAbonnement";
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
  const session = await requireProprietaire();
  const { plan: planActuel } = session;

  // La date d'échéance vient de la fiche, pas de la session : celle-ci ne
  // porte que le palier effectif.
  const proprietaire = await getProprietaireById(session.proprietaireId);
  const expireLe = proprietaire?.planExpireLe;
  const periodeEnCours = expireLe ? new Date(expireLe) > new Date() : false;

  const kkiapay = kkiapayConfigure()
    ? {
        clePublique: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY!,
        bacASable: process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== "false",
      }
    : undefined;

  const { data } = await supabaseUtilisateur()
    .from("plan")
    .select("id, slug, nom, prix_fcfa, description, fonctionnalites, max_baux")
    .order("prix_fcfa", { ascending: true });

  // max_baux vient de la base : le dupliquer ici le ferait diverger du quota
  // réellement appliqué par le trigger.
  const plans = (data ?? []) as LignePlan[];

  return (
    /* Un seul fournisseur pour toute la page : le SDK KKiaPay ne garde qu'un
       écouteur de succès, et l'état du paiement ne peut donc pas vivre dans
       les cartes. Sans clé, il rend ses enfants tels quels. */
    <PaiementAbonnement
      clePublique={kkiapay?.clePublique}
      bacASable={kkiapay?.bacASable ?? true}
      nomProprietaire={session.nom}
    >
      <div>
        <div className="max-w-[42em]">
          <h1 className="font-display text-ink text-3xl font-semibold">
            Votre compte est prêt — choisissez votre palier
          </h1>
          <p className="text-ink-2 mt-3 leading-relaxed">
            Vous payez uniquement sur ce qui vous rapporte : le palier dépend du nombre de{" "}
            <strong className="text-ink font-semibold">logements loués</strong>. Un logement vacant
            ne compte pas, et vous pouvez changer de palier à tout moment.
          </p>
        </div>

        {/* Le propriétaire doit savoir jusqu'à quand il est couvert : sans cette
          date, l'expiration le prendrait de court, quota bloqué sans préavis. */}
        {periodeEnCours && expireLe && (
          <p className="border-line bg-highlight text-ink mt-6 rounded-md border p-4 text-sm">
            Votre palier <strong className="font-semibold">{planActuel}</strong> court
            jusqu&rsquo;au{" "}
            <strong className="font-semibold">
              {new Date(expireLe).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
            . Sans renouvellement, vous repasserez automatiquement en Essentiel — vos baux existants
            resteront visibles, mais vous ne pourrez plus en créer au-delà de la limite gratuite.
          </p>
        )}

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
                ) : plan.prix_fcfa > 0 && kkiapay ? (
                  /* Palier payant : il passe par un paiement vérifié. La porte
                   du formulaire simple est fermée — elle donnait Business
                   gratuitement à qui savait poster le bon champ. */
                  <div className="w-full">
                    <BoutonPalier
                      plan={plan.slug as PlanId}
                      libelle={`Passer en ${plan.nom}`}
                      misEnAvant={misEnAvant}
                    />
                  </div>
                ) : plan.prix_fcfa > 0 ? (
                  <p className="border-line text-ink-3 w-full rounded-md border border-dashed px-4 py-2.5 text-center text-sm">
                    Paiement en ligne indisponible
                  </p>
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
                      Revenir à {plan.nom}
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
    </PaiementAbonnement>
  );
}
