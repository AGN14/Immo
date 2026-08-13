import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function InscriptionProprietairePage() {
  return (
    <div>
      <Link href="/inscription" className="text-ink-3 text-[0.82rem] no-underline">
        ← Choisir un autre profil
      </Link>
      <h1 className="font-display text-ink mt-3 text-[1.9rem] font-bold">
        Créer un compte propriétaire
      </h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">
        Gratuit pour un premier bien, sans carte bancaire.
      </p>

      <form action={signup} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value="proprietaire" />
        <Input label="Nom complet" type="text" name="nom" placeholder="Aïssatou Diallo" required />
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
        <Button type="submit" variant="primary" block>
          Créer mon compte
        </Button>
        <p className="text-ink-3 text-[0.8rem]">
          En créant un compte, vous acceptez nos Conditions d&rsquo;utilisation.
        </p>
      </form>

      <p className="text-ink-3 mt-6 text-[0.88rem]">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-primary font-semibold no-underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
