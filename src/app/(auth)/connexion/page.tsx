import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ConnexionPage() {
  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-ink text-2xl font-semibold">Connexion</h1>
        <p className="text-ink-2 mt-1 text-sm">Accédez à votre espace Immo.</p>

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
