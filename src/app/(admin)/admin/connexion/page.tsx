import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/guard";
import { loginAdmin } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata = { title: "Connexion · Administration" };

/**
 * Le guichet de l'équipe : volontairement neutre — aucun logo, aucun lien
 * vers le site public ni vers l'inscription. Déjà connecté en admin : on file
 * au pilotage plutôt que de reposer la question.
 */
const ERREURS: Record<string, string> = {
  identifiants: "Adresse e-mail ou mot de passe incorrect.",
  reserve: "Cet espace est réservé à l'équipe.",
};

export default async function ConnexionAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (session && isAdminEmail(session.email)) redirect("/admin");

  const erreur = ERREURS[String((await searchParams).erreur ?? "")];

  return (
    <div className="bg-paper flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="border-line bg-surface w-full max-w-[400px] rounded-lg border p-6 shadow-sm sm:p-8">
        <p className="text-ink-3 text-xs font-semibold tracking-widest uppercase">Administration</p>
        <h1 className="font-display text-ink mt-1 text-2xl font-semibold">Connexion</h1>
        <p className="text-ink-2 mt-1 text-sm">Accès réservé à l&apos;équipe.</p>

        {erreur && (
          <p className="border-danger bg-danger-soft text-ink mt-5 rounded-md border p-3 text-sm">
            {erreur}
          </p>
        )}

        <form action={loginAdmin} className="mt-6 flex flex-col gap-4">
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
    </div>
  );
}
