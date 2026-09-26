"use client";

import { useState } from "react";
import { initierPaiementLoyerEnLigne } from "@/lib/actions/paiement-en-ligne";

/**
 * Paiement en ligne par GeniusPay.
 *
 * Pas de widget : un clic demande au serveur de créer le paiement, puis le
 * navigateur part sur la page de checkout GeniusPay. Au retour,
 * `/payer/confirmation` vérifie et enregistre. Le montant affiché vient du
 * serveur via les props — il est affiché, jamais saisi.
 */
export function BoutonGeniusPay({
  montantFcfa,
  mois,
  bacASable,
}: {
  montantFcfa: number;
  mois: string[];
  bacASable: boolean;
}) {
  const [encours, setEncours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const payer = async () => {
    setErreur(null);
    setEncours(true);
    const etat = await initierPaiementLoyerEnLigne(mois);
    if (!etat.ok || !etat.checkoutUrl) {
      setEncours(false);
      setErreur(etat.erreur ?? "Paiement non initié. Réessayez dans un instant.");
      return;
    }
    window.location.href = etat.checkoutUrl;
  };

  return (
    <>
      <button
        type="button"
        onClick={payer}
        disabled={encours || montantFcfa <= 0}
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta w-full rounded-md px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {encours
          ? "Redirection vers le paiement…"
          : `Payer ${montantFcfa.toLocaleString("fr-FR")} F maintenant`}
      </button>

      {bacASable && (
        <p className="text-ink-3 mt-2 text-center text-xs">
          Mode bac à sable — aucun argent réel ne circule.
        </p>
      )}

      {erreur && (
        <p className="border-danger bg-danger-soft text-ink mt-3 rounded-md border p-3 text-sm">
          {erreur}
        </p>
      )}
    </>
  );
}
