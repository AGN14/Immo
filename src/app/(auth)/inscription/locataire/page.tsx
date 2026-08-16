import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { MessageInscription } from "@/app/(auth)/inscription/MessageInscription";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default async function InscriptionLocatairePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
          Créer un compte locataire
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          Toujours gratuit. Il vous faut le code de votre bien, transmis par votre propriétaire.
        </p>

        <MessageInscription code={erreur} />

        <form action={signup} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value="locataire" />
          <Input
            label="Code du bien"
            type="text"
            name="codeBien"
            placeholder="Ex. BAOBAB-3B"
            hint="Demandez ce code à votre propriétaire."
            required
          />
          <Input label="Nom complet" type="text" name="nom" placeholder="Kouadio Yves" required />
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
