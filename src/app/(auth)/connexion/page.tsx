"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ConnexionPage() {
  const [role, setRole] = useState<"proprietaire" | "locataire">("proprietaire");

  return (
    <div>
      <h1 className="font-display text-ink text-[1.9rem] font-bold">Connexion</h1>
      <p className="text-ink-2 mt-2 text-[0.95rem]">Accédez à votre espace Immo.</p>

      <div className="bg-lilac rounded-pill mt-6 inline-flex gap-1 p-1">
        <button
          type="button"
          onClick={() => setRole("proprietaire")}
          className={`rounded-pill px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
            role === "proprietaire" ? "bg-surface text-ink shadow-sm" : "text-ink-3"
          }`}
        >
          Propriétaire
        </button>
        <button
          type="button"
          onClick={() => setRole("locataire")}
          className={`rounded-pill px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
            role === "locataire" ? "bg-surface text-ink shadow-sm" : "text-ink-3"
          }`}
        >
          Locataire
        </button>
      </div>

      <form action={login} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          placeholder="vous@exemple.com"
          required
        />
        <Input label="Mot de passe" type="password" name="password" required />
        <Button type="submit" variant="primary" block>
          Se connecter
        </Button>
      </form>

      <p className="text-ink-3 mt-6 text-[0.88rem]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-primary font-semibold no-underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
