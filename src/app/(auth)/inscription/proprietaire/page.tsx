import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { PLANS } from "@/lib/plans";
import { FormulaireInscription } from "@/app/(auth)/inscription/FormulaireInscription";

export default async function InscriptionProprietairePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Le lien « Passer en Pro » ou « Passer en Business » de la page Tarifs
  // arrive avec ?plan=... : on le confirme à l'écran au lieu de l'ignorer.
  const planChoisi = (await searchParams).plan;
  const pro = planChoisi === "pro";
  const business = planChoisi === "business";
  const offre = pro ? PLANS.pro : business ? PLANS.business : null;

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <Link
          href="/inscription"
          className="text-ink-3 hover:text-ink inline-flex items-center gap-1.5 text-sm no-underline [&_svg]:size-4 [&_svg]:shrink-0"
        >
          <ArrowLeftIcon />
          Choisir un autre profil
        </Link>
        <h1 className="font-display text-ink mt-3 text-2xl font-semibold">
          Créer un compte propriétaire
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          {offre
            ? `Vous avez choisi l'offre ${offre.nom}. Créez votre compte, l'abonnement se règle ensuite.`
            : "Gratuit pour un premier bien, sans carte bancaire."}
        </p>

        {offre && (
          <p className="border-line bg-highlight text-ink mt-4 rounded-md border px-3 py-2 text-sm">
            <strong className="font-semibold">Offre {offre.nom}</strong> —{" "}
            {offre.prixFcfa.toLocaleString("fr-FR")} FCFA / mois,{" "}
            {offre.maxBaux === null
              ? "logements loués illimités"
              : `jusqu'à ${offre.maxBaux} logements loués`}.{" "}
            <Link href="/#tarifs" className="text-primary font-semibold no-underline">
              Changer d&rsquo;offre
            </Link>
          </p>
        )}

        <FormulaireInscription role="proprietaire" plan={offre ? offre.id : "essentiel"} />
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
