import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/mock-session";
import {
  getBailDuLocataire,
  getPaiementsDuLocataire,
  getVersementsDuLocataire,
} from "@/lib/data";
import { moisAPayer } from "@/lib/echeances";
import { FormulaireDeclaration } from "@/app/(app)/payer/FormulaireDeclaration";

export default async function PayerPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "locataire" || !session.locataireId) redirect("/dashboard");

  const bail = await getBailDuLocataire(session.locataireId);

  if (!bail) {
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

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-ink text-3xl font-semibold">Payer mon loyer</h1>
      <p className="text-ink-2 mt-2">
        {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F par mois. Déclarez le paiement :
        votre propriétaire le confirmera avant l&rsquo;émission de la quittance.
      </p>

      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <FormulaireDeclaration
          loyerMensuelFcfa={bail.loyerMensuelFcfa}
          moisDue={moisDue}
        />
      </div>
    </div>
  );
}
