import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Adresse inconnue et mot de passe faux partagent le même message : le
 * formulaire ne doit pas devenir un moyen de savoir qui possède un compte.
 */
const ERREURS: Record<string, string> = {
  identifiants: "Adresse e-mail ou mot de passe incorrect.",
  lien: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const erreur = ERREURS[String((await searchParams).erreur ?? "")];

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-ink text-2xl font-semibold">Connexion</h1>
        <p className="text-ink-2 mt-1 text-sm">Accédez à votre espace Immo.</p>

        {erreur && (
          <p className="border-danger bg-danger-soft text-ink mt-5 rounded-md border p-3 text-sm">
            {erreur}
          </p>
        )}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <Input
            label="Adresse e-mail"
            type="email"
            name="email"
            placeholder="vous@exemple.com"
            required
          />
          <Input label="Mot de passe" type="password" name="password" required />
          <Button type="submit" variant="primary" block className="mt-1">
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/connexion/oublie" className="text-ink-3 hover:text-ink no-underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary font-semibold no-underline">
          Créer un compte
        </Link>
      </p>
    </>
  );
}
