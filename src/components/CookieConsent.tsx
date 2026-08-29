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

function Interrupteur({
  actif,
  surBasculer,
  libelle,
}: {
  actif: boolean;
  surBasculer: (v: boolean) => void;
  libelle: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      onClick={() => surBasculer(!actif)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        actif ? "bg-[var(--primary)]" : "bg-[var(--line)]"
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform ${
          actif ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="bg-[var(--paper)] flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--line)] shadow-[var(--shadow-cta)] sm:max-w-xl sm:rounded-2xl">
        <div className="overflow-y-auto p-6 sm:p-8">
          <p className="text-[var(--primary)] text-xs font-semibold uppercase tracking-wide">
            Confidentialité · Xwégán
          </p>
          <h2 className="font-display text-[var(--ink)] mt-2 text-2xl font-semibold leading-tight">
            Vos données, votre choix
          </h2>
          <p className="text-[var(--ink-2)] mt-2 text-sm leading-relaxed">
            Xwégán utilise des cookies pour assurer le fonctionnement du
            service et, selon votre choix, pour mesurer son usage ou traiter
            les paiements. Vous pouvez modifier vos préférences à tout moment.{" "}
            <Link
              href="/cookies"
              className="text-[var(--primary)] font-semibold no-underline hover:underline"
            >
              En savoir plus
            </Link>
          </p>

          <div className="mt-6 space-y-2">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4">
              <div>
                <p className="text-[var(--ink)] flex items-center gap-2 text-sm font-semibold">
                  Strictement nécessaires
                  <span className="text-[var(--ink-3)] text-xs font-normal">
                    (toujours actifs)
                  </span>
                </p>
                <p className="text-[var(--ink-3)] mt-1 text-xs leading-relaxed">
                  Connexion sécurisée, protection de la session et préférences
                  d&rsquo;affichage. Indispensables au service.
                </p>
              </div>
              <span className="mt-0.5 shrink-0 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1 text-xs font-medium text-[var(--ink-3)]">
                Verrouillé
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4">
              <div>
                <p className="text-[var(--ink)] text-sm font-semibold">
                  Mesure d&rsquo;audience
                </p>
                <p className="text-[var(--ink-3)] mt-1 text-xs leading-relaxed">
                  Statistiques anonymes d&rsquo;utilisation (Plausible).
                </p>
              </div>
              <Interrupteur
                actif={analytique}
                surBasculer={setAnalytique}
                libelle="Accepter la mesure d'audience"
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-4">
              <div>
                <p className="text-[var(--ink)] text-sm font-semibold">
                  Paiement
                </p>
                <p className="text-[var(--ink-3)] mt-1 text-xs leading-relaxed">
                  Cookies du widget KKiaPay lors d&rsquo;un règlement Mobile
                  Money.
                </p>
              </div>
              <Interrupteur
                actif={paiement}
                surBasculer={setPaiement}
                libelle="Accepter les cookies de paiement"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-[var(--sand)] p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={() => enregistrer(DEFAUT)}
            className="rounded-md px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-black/5"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() =>
              enregistrer({ necessaires: true, analytique, paiement })
            }
            className="rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink-3)] hover:bg-[var(--surface)]"
          >
            Enregistrer mon choix
          </button>
          <button
            type="button"
            onClick={() =>
              enregistrer({ necessaires: true, analytique: true, paiement: true })
            }
            className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--on-primary)] shadow-[var(--shadow-cta)] transition-colors hover:bg-[var(--primary-hi)]"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
