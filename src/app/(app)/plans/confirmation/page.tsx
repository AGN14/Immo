import Link from "next/link";
import { requireProprietaire } from "@/lib/auth/session";
import { retrouverPaiementAbonnement, souscrireAbonnement } from "@/lib/actions/abonnement";
import { PLANS, type PlanId } from "@/lib/plans";

export const metadata = { title: "Confirmation de l'abonnement" };

/** Rejouée à chaque visite : un rechargement ne prolonge rien deux fois
 *  (référence déjà consommée = rien à trouver = message neutre). */
export const dynamic = "force-dynamic";

/**
 * Retour du checkout GeniusPay : retrouve le paiement abouti et active le
 * palier. Le plan vient de l'URL (choisi avant la création du paiement), la
 * preuve vient de l'opérateur.
 */
export default async function ConfirmationAbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  await requireProprietaire();
  const params = await searchParams;
  const plan = (Array.isArray(params.plan) ? params.plan[0] : params.plan) as PlanId;

  if (!plan || !PLANS[plan] || PLANS[plan].prixFcfa <= 0) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-ink text-3xl font-semibold">Lien invalide</h1>
        <p className="text-ink-2 mt-2 text-sm">
          Palier inconnu. Repassez par la page des plans pour relancer le paiement.
        </p>
        <Link
          href="/plans"
          className="text-primary mt-4 inline-block text-sm font-semibold no-underline"
        >
          ← Retour aux plans
        </Link>
      </div>
    );
  }

  const trouve = await retrouverPaiementAbonnement(plan);
  if (!trouve.ok || !trouve.reference) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-ink text-3xl font-semibold">Paiement non abouti</h1>
        <div className="border-line bg-surface mt-8 rounded-md border p-6">
          <p className="text-ink-2 text-sm">
            {trouve.erreur ?? "Aucun paiement abouti à enregistrer."} Aucun montant n&apos;a été
            débité, ou le palier est déjà actif.
          </p>
          <Link
            href="/plans"
            className="border-line text-ink hover:border-ink-3 mt-4 inline-block rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
          >
            ← Retour aux plans
          </Link>
        </div>
      </div>
    );
  }

  const etat = await souscrireAbonnement(trouve.reference, plan);

  if (etat.ok) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-ink text-3xl font-semibold">
          Bienvenue en {PLANS[plan].nom}
        </h1>
        <div className="border-line bg-surface mt-8 rounded-md border p-6">
          <p className="text-ink-2 text-sm">
            Votre palier est actif pour 30 jours. Référence : {trouve.reference}.
          </p>
          <Link
            href="/dashboard"
            className="bg-primary text-on-primary hover:bg-primary-hi mt-4 inline-block rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
          >
            Aller au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-ink text-3xl font-semibold">Activation impossible</h1>
      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <p className="text-ink-2 text-sm">
          {etat.erreur ?? "Enregistrement impossible."} Votre paiement a peut-être été débité —
          contactez le support avec la référence {trouve.reference}.
        </p>
        <Link
          href="/plans"
          className="border-line text-ink hover:border-ink-3 mt-4 inline-block rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
        >
          ← Retour aux plans
        </Link>
      </div>
    </div>
  );
}
