import Link from "next/link";
import { redirect } from "next/navigation";
import { declarerPaiement } from "@/lib/actions/locataire";
import { dateEcheance, jourEcheance, moisAPayer, penaliteDuMois, soldeDu } from "@/lib/echeances";
import { donneesEcheance, getLogementDuLocataire } from "@/lib/mock-data";
import { compositionLabel } from "@/lib/status-labels";
import { requireLocataire } from "@/lib/auth/mock-session";
import { FormulairePaiement } from "@/app/(app)/payer/FormulairePaiement";

const ERREURS: Record<string, string> = {
  NOMBRE_INVALIDE: "Choisissez entre 1 et 12 mois.",
  RIEN_A_PAYER: "Vous n'avez aucun mois à régler pour le moment.",
  BAIL_TERMINE: "Votre bail est terminé.",
  BAIL_INTROUVABLE: "Aucun bail actif sur votre compte.",
};

export default async function PayerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locataireId } = await requireLocataire();
  const logement = getLogementDuLocataire(locataireId);
  if (!logement?.bail || !logement.lot || !logement.proprietaire) redirect("/dashboard");

  const { bail, lot, proprietaire } = logement;
  const { paiements, versements } = donneesEcheance();

  const solde = soldeDu(bail, proprietaire, paiements, versements);
  const jour = jourEcheance(bail, proprietaire);

  // On pré-calcule les 12 échéances possibles : le formulaire n'a plus qu'à
  // afficher celles que le nombre choisi couvre.
  const douzeMois = moisAPayer(bail, paiements, versements, 12);
  const enRetard = new Set(solde.mois);

  const erreur = ERREURS[String((await searchParams).erreur ?? "")];

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/dashboard" className="text-ink-3 hover:text-ink text-sm no-underline">
        ← Retour à mon espace
      </Link>

      <h1 className="font-display text-ink mt-3 text-3xl font-semibold">Payer mon loyer</h1>
      <p className="text-ink-2 mt-2">
        {lot.nom} — {compositionLabel[lot.composition]} ·{" "}
        <span data-numeric>{bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F</span> par mois, dû le{" "}
        {jour}.
      </p>

      {erreur && (
        <p className="border-danger bg-danger-soft text-ink mt-6 rounded-md border p-4 text-sm">
          {erreur}
        </p>
      )}

      {/* Le préavis se dit avant le formulaire : c'est plus grave que le solde,
          et le locataire doit le lire même s'il ne paie pas aujourd'hui. */}
      {solde.sousPreavis.length > 0 && (
        <div className="border-danger bg-danger-soft mt-6 rounded-md border p-4">
          <p className="text-ink text-sm font-semibold">
            Délai de régularisation dépassé — vous risquez un préavis de départ
          </p>
          <p className="text-ink-2 mt-1 text-sm">
            {solde.sousPreavis.join(", ")} {solde.sousPreavis.length > 1 ? "sont" : "est"} impayé
            {solde.sousPreavis.length > 1 && "s"} au-delà des {proprietaire.delaiToleranceJours}{" "}
            jours de tolérance. Régularisez au plus vite et contactez {proprietaire.nom}.
          </p>
        </div>
      )}

      <FormulairePaiement
        action={declarerPaiement}
        loyerMensuelFcfa={bail.loyerMensuelFcfa}
        mois={douzeMois}
        moisEnRetard={[...enRetard]}
        echeances={douzeMois.map((m) => dateEcheance(m, jour).toISOString().slice(0, 10))}
        penalites={douzeMois.map((m) => penaliteDuMois(m, bail, proprietaire))}
      />

      <p className="text-ink-3 mt-6 text-sm">
        Votre paiement est d&rsquo;abord <strong className="font-semibold">déclaré</strong>, puis
        confirmé par {proprietaire.nom}. Votre quittance est émise dès la confirmation.
      </p>
    </div>
  );
}
