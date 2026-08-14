import Link from "next/link";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { getPlan, PLANS } from "@/lib/plans";
import {
  getBauxActifs,
  getBiens,
  getLocataires,
  getLots,
  getProprietaireById,
  getSignalementsOuverts,
} from "@/lib/data";
import { FormulaireMotDePasse } from "@/components/profil/FormulaireMotDePasse";
import { FormulaireNom } from "@/components/profil/FormulaireNom";
import { SupprimerCompte } from "@/components/profil/SupprimerCompte";

export const metadata = { title: "Mon profil" };

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="border-line bg-sand rounded-md border px-4 py-3">
      <dt className="text-ink-3 text-sm">{label}</dt>
      <dd className="text-ink mt-0.5 font-semibold" data-numeric>
        {valeur}
      </dd>
    </div>
  );
}

export default async function ProfilPage() {
  const session = await requireProprietaire();
  const plan = getPlan(session.plan);
  const prix = PLANS[plan.id].prixFcfa;
  const initiale = session.nom.trim()[0]?.toUpperCase() ?? "?";

  const [compte, biens, lots, locataires, bauxActifs, signalementsOuverts] = await Promise.all([
    getProprietaireById(session.proprietaireId),
    getBiens(session.proprietaireId),
    getLots(session.proprietaireId),
    getLocataires(session.proprietaireId),
    getBauxActifs(session.proprietaireId),
    getSignalementsOuverts(session.proprietaireId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-ink text-3xl font-semibold">Mon profil</h1>
      <p className="text-ink-2 mt-2">
        Votre compte, votre palier — vous restez connecté en toutes circonstances.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <section className="border-line bg-surface rounded-md border p-6">
          <h2 className="font-display text-ink text-lg font-semibold">Compte</h2>
          <div className="mt-4 flex items-center gap-4">
            <span
              className="bg-primary-soft text-primary grid size-14 place-items-center rounded-full text-xl font-bold"
              aria-hidden="true"
            >
              {initiale}
            </span>
            <div>
              <div className="text-ink font-semibold">{session.nom}</div>
              <div className="text-ink-3 text-sm">{session.email}</div>
              {compte && (
                <div className="text-ink-3 text-sm">
                  Membre depuis le{" "}
                  {new Date(compte.creeLe).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="border-line mt-6 border-t pt-5">
            <FormulaireNom nom={session.nom} />
          </div>
        </section>

        <section className="border-line bg-surface rounded-md border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-ink text-lg font-semibold">Palier actuel</h2>
              <p className="text-ink-2 mt-1 text-sm">
                {plan.nom} —{" "}
                <span data-numeric>{prix.toLocaleString("fr-FR")} FCFA / mois</span>
                {plan.maxBaux === null
                  ? ", logements loués illimités."
                  : `, jusqu'à ${plan.maxBaux} logements loués.`}
              </p>
            </div>
            <Link
              href="/plans"
              className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Changer de plan
            </Link>
          </div>
        </section>

        <section className="border-line bg-surface rounded-md border p-6">
          <h2 className="font-display text-ink text-lg font-semibold">Votre parc en bref</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Info label="Biens" valeur={String(biens.length)} />
            <Info label="Logements" valeur={String(lots.length)} />
            <Info label="Baux actifs" valeur={String(bauxActifs.length)} />
            <Info label="Locataires" valeur={String(locataires.length)} />
            <Info label="Signalements ouverts" valeur={String(signalementsOuverts.length)} />
            <Info
              label="Occupation"
              valeur={
                lots.length === 0
                  ? "—"
                  : `${Math.round((bauxActifs.length / lots.length) * 100)} %`
              }
            />
          </dl>
        </section>

        {compte && (
          <section className="border-line bg-surface rounded-md border p-6">
            <h2 className="font-display text-ink text-lg font-semibold">Paramètres du parc</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Info
                label="Jour d'échéance par défaut"
                valeur={`Le ${compte.jourEcheanceDefaut} du mois`}
              />
              <Info
                label="Jour de reversement"
                valeur={`Le ${compte.jourReversement} du mois`}
              />
            </dl>
            <p className="text-ink-3 mt-3 text-sm">
              Ces réglages s&rsquo;appliquent à chaque nouveau bail ; modifiez-les bientôt depuis
              le suivi des reversements.
            </p>
          </section>
        )}

        <section className="border-line bg-surface rounded-md border p-6">
          <h2 className="font-display text-ink text-lg font-semibold">Sécurité</h2>
          <p className="text-ink-2 mt-1 text-sm">
            Votre mot de passe confirme les modifications sensibles, comme l&rsquo;édition d&rsquo;un
            bien. {compte?.aMotDePasse
              ? "Il est déjà défini : vous pouvez le changer."
              : "Aucun mot de passe défini pour le moment : définissez-en un."}
          </p>
          <div className="border-line mt-4 border-t pt-5">
            <FormulaireMotDePasse aMotDePasse={compte?.aMotDePasse ?? false} />
          </div>
        </section>

        <section className="border-line bg-surface rounded-md border p-6">
          <h2 className="font-display text-ink text-lg font-semibold">Zone sensible</h2>
          <p className="text-ink-2 mt-1 text-sm">
            Supprimer votre compte : le parc et son historique sont conservés en base, mais
            cette adresse ne pourra plus se connecter. La déconnexion reste disponible dans la
            barre latérale.
          </p>
          <div className="mt-4">
            <SupprimerCompte />
          </div>
        </section>
      </div>
    </div>
  );
}
