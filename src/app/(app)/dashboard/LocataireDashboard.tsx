import Link from "next/link";
import { dateEcheance, jourEcheance, moisAPayer, soldeDu, statutDuMois } from "@/lib/echeances";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getQuittancesDuLocataire,
  getSignalementsDuLocataire,
  getVersementsDuLocataire,
  periodeCourante,
} from "@/lib/data";
import {
  compositionLabel,
  methodeLabel,
  statutLoyerLabel,
  statutSignalementLabel,
  urgenceLabel,
} from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";

const dateFr = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export async function LocataireDashboard({ nom, locataireId }: { nom: string; locataireId: string }) {
  const logement = await getLogementDuLocataire(locataireId);

  if (!logement?.bail || !logement.lot || !logement.bien || !logement.proprietaire) {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Bienvenue, {nom}.</h1>
        <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-ink-3 text-sm">
            Aucun bail en cours sur votre compte. Demandez son code à votre propriétaire pour
            rejoindre votre logement.
          </p>
        </div>
      </div>
    );
  }

  const { bail, lot, bien, proprietaire } = logement;

  const [paiements, versements, quittances, signalements] = await Promise.all([
    getPaiementsDuLocataire(locataireId),
    getVersementsDuLocataire(locataireId),
    getQuittancesDuLocataire(locataireId),
    getSignalementsDuLocataire(locataireId),
  ]);

  // Pour la table d'historique, un annuaire local évite une requête par ligne.
  const versementParId = new Map(versements.map((v) => [v.id, v]));

  const jour = jourEcheance(bail, proprietaire);
  const periode = periodeCourante();
  const solde = soldeDu(bail, proprietaire, paiements, versements);
  // Le premier mois à régler : les arriérés d'abord, sinon le premier mois
  // futur non couvert — surtout pas le mois courant s'il est déjà payé.
  const prochaine = moisAPayer(bail, paiements, versements, 1)[0];

  // La pastille doit refléter la situation d'ensemble, pas le seul mois courant :
  // afficher « À jour » à côté d'un solde débiteur serait contradictoire.
  const statut =
    statutLoyerLabel[
      solde.mois.length > 0
        ? "en-retard"
        : statutDuMois(periode, bail, proprietaire, paiements, versements)
    ];

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Bienvenue, {nom}.</h1>
      <p className="text-ink-2 mt-2">
        {lot.nom} — {compositionLabel[lot.composition]}, {bien.nom}, {bien.quartier} ({bien.ville}).
      </p>

      {/* Le solde d'abord : c'est la seule chose qu'un locataire vient vérifier. */}
      <section
        className={`mt-8 rounded-lg border p-6 ${
          solde.montantFcfa > 0 ? "border-danger bg-danger-soft" : "border-line bg-surface"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-ink-2 text-sm">
              {solde.montantFcfa > 0 ? "Vous devez" : "Votre loyer est à jour"}
            </p>
            <p className="font-display text-primary mt-1 text-4xl font-semibold" data-numeric>
              {solde.montantFcfa.toLocaleString("fr-FR")} F
            </p>
            <p className="text-ink-2 mt-1 text-sm">
              {solde.mois.length > 0
                ? `${solde.mois.length} mois échu${solde.mois.length > 1 ? "s" : ""} : ${solde.mois.join(", ")}`
                : `Prochaine échéance : ${prochaine}, à régler avant le ${dateFr(dateEcheance(prochaine, jour))}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
            <Link
              href="/payer"
              className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-5 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Payer mon loyer
            </Link>
          </div>
        </div>

        <dl className="border-line-soft mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ink-3">Loyer mensuel</dt>
            <dd className="text-ink font-semibold" data-numeric>
              {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F
            </dd>
          </div>
          <div>
            <dt className="text-ink-3">Dû le</dt>
            <dd className="text-ink font-semibold" data-numeric>
              {jour} de chaque mois
            </dd>
          </div>
          <div>
            <dt className="text-ink-3">Depuis le</dt>
            <dd className="text-ink font-semibold">{dateFr(bail.dateDebut)}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Propriétaire</dt>
            <dd className="text-ink font-semibold">{proprietaire.nom}</dd>
          </div>
        </dl>
      </section>

      {/* Signalements */}
      <div className="mt-12 flex items-baseline justify-between">
        <h2 className="font-display text-ink text-2xl font-semibold">Pannes et problèmes</h2>
        <Link href="/signaler" className="text-primary text-sm font-semibold no-underline">
          Signaler un problème
        </Link>
      </div>

      {signalements.length === 0 ? (
        <p className="text-ink-3 mt-3 text-sm">Aucun signalement en cours sur votre logement.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {signalements.map((s) => {
            const etat = statutSignalementLabel[s.statut];
            const urgence = urgenceLabel[s.urgence];
            return (
              <li key={s.id} className="border-line bg-surface rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-ink font-sans text-base font-semibold">{s.titre}</h3>
                    <p className="text-ink-2 mt-1 text-sm">{s.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.urgence === "haute" && (
                      <StatusPill tone={urgence.tone}>{urgence.label}</StatusPill>
                    )}
                    <StatusPill tone={etat.tone}>{etat.label}</StatusPill>
                  </div>
                </div>
                <p className="text-ink-3 mt-2 text-sm">Signalé le {dateFr(s.creeLe)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Historique et quittances */}
      <h2 className="font-display text-ink mt-12 text-2xl font-semibold">Mes paiements</h2>
      <p className="text-ink-2 mt-1 text-sm">
        Votre quittance est émise dès que le paiement est confirmé.
      </p>

      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className="text-ink-2 px-4 py-3 font-medium">Mois</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Montant</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Moyen</th>
              <th className="text-ink-2 px-4 py-3 font-medium">Quittance</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => {
              const versement = versementParId.get(p.versementId);
              const quittance = quittances.find((q) => q.paiementId === p.id);
              return (
                <tr key={p.id} className="border-line border-b last:border-0">
                  <td className="text-ink-2 px-4 py-3">{p.periode}</td>
                  <td className="text-primary px-4 py-3 font-semibold">
                    {p.montantFcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="text-ink-2 px-4 py-3">
                    {versement ? methodeLabel[versement.methode] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {quittance ? (
                      <span className="text-primary font-semibold" data-numeric>
                        {quittance.numero}
                      </span>
                    ) : (
                      <span className="text-ink-3">En attente de confirmation</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
