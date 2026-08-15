"use client";

import { useState } from "react";
import Link from "next/link";
import { inscrireNewsletter, type ResultatNewsletter } from "@/lib/actions/newsletter";

export function NewsletterForm() {
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (succes) return;

    const resultat: ResultatNewsletter = await inscrireNewsletter(
      new FormData(e.currentTarget),
    );

    if (resultat.statut === "ok") {
      setSucces(true);
      setErreur(null);
    } else {
      setErreur(resultat.message);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2">
        <input
          type="email"
          name="email"
          placeholder="vous@exemple.com"
          aria-label="Adresse e-mail"
          required
          disabled={succes}
          className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary min-w-0 flex-1 rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-60"
        />
        <label className="text-ink-3 flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            name="consentement"
            required
            disabled={succes}
            className="mt-0.5"
          />
          <span>
            J&rsquo;accepte de recevoir la newsletter de Xwégán (un e-mail par
            mois, rien d&rsquo;autre), et j&rsquo;ai lu la{" "}
            <Link
              href="/confidentialite"
              className="text-primary font-semibold no-underline"
            >
              politique de confidentialité
            </Link>
            . Désinscription possible à tout moment via le lien de chaque
            e-mail.
          </span>
        </label>
        <button
          type="submit"
          disabled={succes}
          className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {succes ? "Merci !" : "S'abonner"}
        </button>
        {succes && (
          <p className="text-ink-3 text-xs">
            Vous êtes inscrit, bienvenue à bord.
          </p>
        )}
        {erreur && <p className="text-ink-2 text-xs">{erreur}</p>}
      </form>
    </>
  );
}