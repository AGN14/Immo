import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default async function InscriptionProprietairePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Le lien « Passer en Pro » de la page Tarifs arrive avec ?plan=pro : on le
  // confirme à l'écran au lieu de l'ignorer silencieusement.
  const pro = (await searchParams).plan === "pro";

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <Link href="/inscription" className="text-ink-3 hover:text-ink text-sm no-underline">
          ← Choisir un autre profil
        </Link>
        <h1 className="font-display text-ink mt-3 text-2xl font-semibold">
          Créer un compte propriétaire
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          {pro
            ? "Vous avez choisi l'offre Pro. Créez votre compte, l'abonnement se règle ensuite."
            : "Gratuit pour un premier bien, sans carte bancaire."}
        </p>

        {pro && (
          <p className="border-line bg-highlight text-ink mt-4 rounded-md border px-3 py-2 text-sm">
            <strong className="font-semibold">Offre Pro</strong> — 5 000 FCFA / mois, biens
            illimités.{" "}
            <Link href="/#tarifs" className="text-primary font-semibold no-underline">
              Changer d&rsquo;offre
            </Link>
          </p>
        )}

        <form action={signup} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value="proprietaire" />
          <input type="hidden" name="plan" value={pro ? "pro" : "gratuit"} />
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
            placeholder="+221 77 000 00 00"
            required
          />
          <Input label="Mot de passe" type="password" name="password" required />
          <Button type="submit" variant="primary" block className="mt-1">
            Créer mon compte
          </Button>
          <p className="text-ink-3 text-xs">
            En créant un compte, vous acceptez nos Conditions d&rsquo;utilisation.
          </p>
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
