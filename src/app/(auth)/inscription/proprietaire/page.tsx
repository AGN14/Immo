import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PLANS } from "@/lib/plans";

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
  const erreur = (await searchParams).erreur;

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

        {erreur === "consentement" && (
          <p className="border-line bg-highlight text-ink mt-4 rounded-md border px-3 py-2 text-sm">
            Vous devez cocher la case d&rsquo;acceptation des Conditions
            d&rsquo;utilisation et de la Politique de confidentialité pour créer
            un compte.
          </p>
        )}

        <form action={signup} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value="proprietaire" />
          <input type="hidden" name="plan" value={offre ? offre.id : "essentiel"} />
          <Input
            label="Nom complet"
            type="text"
            name="nom"
            placeholder="Aïssatou Diallo"
            required
          />
          <Input
            label="Adresse e-mail"
            type="email"
            name="email"
            placeholder="vous@exemple.com"
            required
          />
          <Input
            label="Téléphone"
            type="tel"
            name="telephone"
            placeholder="+229 01 23 45 67"
            required
          />
          <Input label="Mot de passe" type="password" name="password" required />
          <label className="text-ink-3 flex items-start gap-2 text-xs">
            <input type="checkbox" name="consentement" required className="mt-0.5" />
            <span>
              J&rsquo;accepte les{" "}
              <Link
                href="/conditions-utilisation"
                className="text-primary font-semibold no-underline"
              >
                Conditions d&rsquo;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="/confidentialite" className="text-primary font-semibold no-underline">
                politique de confidentialité
              </Link>{" "}
              de Xwégán.
            </span>
          </label>
          <Button type="submit" variant="primary" block className="mt-1">
            Créer mon compte
          </Button>
        </form>
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
