import Link from "next/link";
import { demanderReinitialisation } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata = { title: "Mot de passe oublié" };

export default async function OubliePage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const envoye = String((await searchParams).envoye ?? "") === "1";

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-ink text-2xl font-semibold">Mot de passe oublié</h1>

        {envoye ? (
          <>
            {/* Message volontairement identique que l'adresse existe ou non :
                confirmer l'existence d'un compte renseignerait un attaquant. */}
            <p className="border-line bg-sand text-ink mt-5 rounded-md border p-4 text-sm">
              Si un compte existe pour cette adresse, un lien de réinitialisation vient d&rsquo;y
              être envoyé. Il est valable une heure et ne sert qu&rsquo;une fois.
            </p>
            <p className="text-ink-3 mt-4 text-sm">
              Pensez à regarder dans les indésirables. Sans courriel au bout de quelques minutes,
              c&rsquo;est probablement qu&rsquo;aucun compte n&rsquo;utilise cette adresse.
            </p>
          </>
        ) : (
          <>
            <p className="text-ink-2 mt-1 text-sm">
              Indiquez votre adresse : nous vous enverrons un lien pour en choisir un nouveau.
            </p>
            <form action={demanderReinitialisation} className="mt-6 flex flex-col gap-4">
              <Input
                label="Adresse e-mail"
                type="email"
                name="email"
                placeholder="vous@exemple.com"
                required
              />
              <Button type="submit" variant="primary" block className="mt-1">
                Envoyer le lien
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Revenir à la connexion
        </Link>
      </p>
    </>
  );
}
