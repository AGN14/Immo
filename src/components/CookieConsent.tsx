"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NOM_COOKIE = "xwegan_consent";
const DUREE_SECONDES = 60 * 60 * 24 * 365; // 1 an

export function CookieConsent() {
  const [afficher, setAfficher] = useState(false);

  useEffect(() => {
    const dejaChoisis = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${NOM_COOKIE}=`));
    if (!dejaChoisis) setAfficher(true);
  }, []);

  const enregistrer = (valeur: "accepte" | "refuse") => {
    document.cookie = `${NOM_COOKIE}=${valeur}; path=/; max-age=${DUREE_SECONDES}; samesite=lax`;
    setAfficher(false);
  };

  if (!afficher) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="border-line bg-paper mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-2 text-sm">
          Xwégán utilise des cookies strictement nécessaires au service
          (connexion sécurisée, mémorisation de vos préférences). En poursuivant
          la navigation, vous acceptez leur utilisation.{" "}
          <Link
            href="/cookies"
            className="text-primary font-semibold no-underline"
          >
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => enregistrer("refuse")}
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => enregistrer("accepte")}
            className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
