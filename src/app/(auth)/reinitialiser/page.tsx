import Link from "next/link";
import { definirNouveauMotDePasse } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata = { title: "Nouveau mot de passe" };

const ERREURS: Record<string, string> = {
  court: "Le mot de passe doit faire au moins 8 caractères.",
  confirmation: "La confirmation ne correspond pas.",
  expire: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.",
};

/**
 * Second temps de la réinitialisation. On y arrive par le lien du courriel,
 * qui a ouvert une session via /auth/rappel — c'est elle qui autorise le
 * changement. Arriver ici sans session fait échouer l'enregistrement.
 */
export default async function ReinitialiserPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const erreur = ERREURS[String((await searchParams).erreur ?? "")];

  return (
    <>
      <div className="border-line bg-surface rounded-lg border p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-ink text-2xl font-semibold">Nouveau mot de passe</h1>
        <p className="text-ink-2 mt-1 text-sm">
          Choisissez-en un nouveau. Vous serez connecté dans la foulée.
        </p>

        {erreur && (
          <p className="border-danger bg-danger-soft text-ink mt-5 rounded-md border p-3 text-sm">
            {erreur}
          </p>
        )}

        <form action={definirNouveauMotDePasse} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nouveau mot de passe"
            type="password"
            name="password"
            required
            minLength={8}
            hint="8 caractères minimum."
          />
          <Input
            label="Confirmez le mot de passe"
            type="password"
            name="confirmation"
            required
            minLength={8}
          />
          <Button type="submit" variant="primary" block className="mt-1">
            Enregistrer
          </Button>
        </form>
      </div>

      <p className="text-ink-2 mt-5 text-center text-sm">
        <Link href="/connexion/oublie" className="text-primary font-semibold no-underline">
          Demander un nouveau lien
        </Link>
      </p>
    </>
  );
}
