import Link from "next/link";
import { requireLocataire } from "@/lib/auth/session";
import { confirmerPaiementLoyerEnLigne } from "@/lib/actions/paiement-en-ligne";

export const metadata = { title: "Confirmation du paiement" };

/** Toujours rejouée à chaque visite : un rechargement rejoue la vérification,
 *  jamais un double encaissement (versement déjà confirmé = succès immédiat). */
export const dynamic = "force-dynamic";

/**
 * Retour du checkout GeniusPay : vérifie le versement en attente et le solde.
 * On arrive ici que l'on vienne d'un succès ou d'un échec — la page tranche
 * d'après l'opérateur, pas d'après l'URL.
 */
export default async function ConfirmationPaiementPage() {
  await requireLocataire();
  const etat = await confirmerPaiementLoyerEnLigne();

  if (etat.ok) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-ink text-3xl font-semibold">Paiement enregistré</h1>
        <div className="border-line bg-surface mt-8 rounded-md border p-6">
          <p className="text-ink text-sm">
            Votre loyer est soldé et votre quittance est disponible.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/quittances"
              className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Voir mes quittances
            </Link>
            <Link
              href="/dashboard"
              className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const enCours = etat.statut === "pending" || etat.statut === "processing";

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-ink text-3xl font-semibold">
        {enCours ? "Paiement en cours" : "Paiement non abouti"}
      </h1>
      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <p className="text-ink-2 text-sm">
          {enCours
            ? "L'opérateur traite encore votre paiement. Revenez dans un instant : cette page vérifiera à nouveau."
            : (etat.erreur ?? "Le paiement n'a pas abouti. Aucun montant n'a été débité.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {enCours && (
            <Link
              href="/payer/confirmation"
              className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Vérifier à nouveau
            </Link>
          )}
          <Link
            href="/payer"
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
          >
            Retour au paiement
          </Link>
        </div>
      </div>
    </div>
  );
}
