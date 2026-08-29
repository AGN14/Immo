"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NOM_COOKIE = "xwegan_consent";
const DUREE_SECONDES = 60 * 60 * 24 * 365; // 1 an

type Choix = {
  necessaires: true;
  analytique: boolean;
  paiement: boolean;
};

const DEFAUT: Choix = { necessaires: true, analytique: false, paiement: false };

function lire(): Choix | null {
  const m = document.cookie.match(new RegExp(`${NOM_COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    return { necessaires: true, ...JSON.parse(decodeURIComponent(m[1])) };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [afficher, setAfficher] = useState(false);
  const [analytique, setAnalytique] = useState(false);
  const [paiement, setPaiement] = useState(false);

  useEffect(() => {
    const existant = lire();
    if (!existant) {
      setAfficher(true);
    } else {
      setAnalytique(existant.analytique);
      setPaiement(existant.paiement);
    }
  }, []);

  const enregistrer = (choix: Choix) => {
    document.cookie = `${NOM_COOKIE}=${encodeURIComponent(
      JSON.stringify(choix),
    )}; path=/; max-age=${DUREE_SECONDES}; samesite=lax`;
    setAfficher(false);
  };

  if (!afficher) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="border-line bg-paper w-full rounded-t-2xl border p-6 shadow-2xl sm:rounded-2xl">
        <h2 className="font-display text-ink text-xl font-semibold">
          Gestion des cookies
        </h2>
        <p className="text-ink-2 mt-2 text-sm">
          Nous utilisons des cookies pour faire fonctionner le service et, avec
          votre accord, pour mesurer son usage ou traiter les paiements. Vous
          gardez la main sur vos préférences à tout moment.{" "}
          <Link href="/cookies" className="text-primary font-semibold no-underline">
            En savoir plus
          </Link>
        </p>

        <ul className="mt-5 space-y-4">
          <li className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-semibold">
                Strictement nécessaires
              </p>
              <p className="text-ink-3 text-xs">
                Connexion et sécurité de votre session, préférences
                d&rsquo;affichage. Toujours actifs.
              </p>
            </div>
            <span className="bg-primary/10 text-primary shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
              Toujours actif
            </span>
          </li>

          <li className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-semibold">Mesure d&rsquo;audience</p>
              <p className="text-ink-3 text-xs">
                Statistiques anonymes d&rsquo;utilisation (Plausible Analytics).
              </p>
            </div>
            <input
              type="checkbox"
              checked={analytique}
              onChange={(e) => setAnalytique(e.target.checked)}
              className="accent-[var(--color-primary)] mt-1 size-5 shrink-0"
              aria-label="Accepter les cookies de mesure d'audience"
            />
          </li>

          <li className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-semibold">Paiement</p>
              <p className="text-ink-3 text-xs">
                Cookies du widget KKiaPay lors d&rsquo;un règlement Mobile Money.
              </p>
            </div>
            <input
              type="checkbox"
              checked={paiement}
              onChange={(e) => setPaiement(e.target.checked)}
              className="accent-[var(--color-primary)] mt-1 size-5 shrink-0"
              aria-label="Accepter les cookies de paiement"
            />
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => enregistrer({ necessaires: true, analytique: true, paiement: true })}
            className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={() => enregistrer(DEFAUT)}
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => enregistrer({ necessaires: true, analytique, paiement })}
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
          >
            Enregistrer mon choix
          </button>
        </div>
      </div>
    </div>
  );
}
