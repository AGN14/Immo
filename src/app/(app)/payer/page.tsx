import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/mock-session";
import {
  getLogementDuLocataire,
  getPaiementsDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { moisAPayer, penaliteDuMois, soldeDu } from "@/lib/echeances";
import { FormulaireDeclaration } from "@/app/(app)/payer/FormulaireDeclaration";

export default async function PayerPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "locataire" || !session.locataireId) redirect("/dashboard");

  // Le propriétaire porte le barème de l'amende et le délai de tolérance :
  // sans lui, impossible d'annoncer le montant réellement dû.
  const logement = await getLogementDuLocataire(session.locataireId);
  const bail = logement?.bail;
  const proprietaire = logement?.proprietaire;

  if (!bail || !proprietaire) {
    return (
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Payer mon loyer</h1>
        <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-ink-3 text-sm">
            Aucun bail en cours sur votre compte. Demandez son code à votre propriétaire pour
            rejoindre votre logement.
          </p>
        </div>
      </div>
    );
  }

  const [paiements, versements] = await Promise.all([
    getPaiementsDuLocataire(session.locataireId),
    getVersementsDuLocataire(session.locataireId),
  ]);
  // Trois mois affichés au maximum ; au-delà, on paye ce qui est dû, pas ce
  // qui arrive.
  const moisDue = moisAPayer(bail, paiements, versements, 3);
  const penalites = Object.fromEntries(
    moisDue.map((periode) => [periode, penaliteDuMois(periode, bail, proprietaire)]),
  );
  const solde = soldeDu(bail, proprietaire, paiements, versements);

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-ink text-3xl font-semibold">Payer mon loyer</h1>
      <p className="text-ink-2 mt-2">
        {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F par mois, dû le{" "}
        {bail.jourEcheance ?? proprietaire.jourEcheanceDefaut}. Déclarez le paiement : votre
        propriétaire le confirmera avant l&rsquo;émission de la quittance.
      </p>

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

      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <FormulaireDeclaration
          loyerMensuelFcfa={bail.loyerMensuelFcfa}
          moisDue={moisDue}
          penalites={penalites}
        />
      </div>
    </div>
  );
}
