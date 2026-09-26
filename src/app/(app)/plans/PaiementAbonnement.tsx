"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { initierAbonnementEnLigne } from "@/lib/actions/abonnement";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Paiement d'abonnement par GeniusPay.
 *
 * Pas de widget ni d'écouteur global : un clic demande au serveur de créer le
 * paiement, puis le navigateur part sur la page de checkout. Au retour,
 * `/plans/confirmation` vérifie et active le palier.
 *
 * Le contexte ne sert plus qu'à partager l'état de chargement entre les
 * cartes — plus aucun SDK à apprivoiser.
 */

type Contexte = {
  ouvrir: (plan: PlanId) => void;
  pret: boolean;
  /** Le palier en cours de traitement, pour désactiver les boutons. */
  encours: PlanId | null;
};

const ContextePaiement = createContext<Contexte | null>(null);

export function usePaiementAbonnement() {
  const c = useContext(ContextePaiement);
  if (!c) throw new Error("usePaiementAbonnement hors de son fournisseur");
  return c;
}

export function PaiementAbonnement({
  configure,
  children,
}: {
  /** Faux tant que les clés ne sont pas renseignées : la page se rend alors
   *  telle quelle, sans paiement en ligne. */
  configure: boolean;
  children: React.ReactNode;
}) {
  const [encours, setEncours] = useState<PlanId | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouvrir = useCallback(
    (plan: PlanId) => {
      if (!configure || encours !== null) return;
      setErreur(null);
      setEncours(plan);
      initierAbonnementEnLigne(plan).then((etat) => {
        if (!etat.ok || !etat.checkoutUrl) {
          setEncours(null);
          setErreur(etat.erreur ?? "Paiement non initié. Réessayez dans un instant.");
          return;
        }
        // On garde l'indicateur jusqu'au départ : le retour se fera sur une
        // autre page, qui portera sa propre confirmation.
        window.location.href = etat.checkoutUrl;
      });
    },
    [configure, encours],
  );

  return (
    <ContextePaiement.Provider value={{ ouvrir, pret: configure, encours }}>
      {/* Le message est au niveau de la page, pas d'une carte : il concerne le
          paiement, pas un palier en particulier. */}
      {erreur && (
        <p className="border-danger bg-danger-soft text-ink mt-6 rounded-md border p-4 text-sm">
          {erreur}
        </p>
      )}

      {children}
    </ContextePaiement.Provider>
  );
}

/** Le bouton ne porte plus ni écouteur ni état : il déclenche, c'est tout. */
export function BoutonPalier({
  plan,
  libelle,
  misEnAvant,
}: {
  plan: PlanId;
  libelle: string;
  misEnAvant: boolean;
}) {
  const { ouvrir, pret, encours } = usePaiementAbonnement();
  const actif = encours === plan;

  return (
    <>
      <button
        type="button"
        onClick={() => ouvrir(plan)}
        disabled={!pret || encours !== null}
        className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          misEnAvant
            ? "bg-primary text-on-primary hover:bg-primary-hi shadow-cta"
            : "border-line text-ink hover:border-ink-3 border"
        }`}
      >
        {actif ? "Redirection vers le paiement…" : libelle}
      </button>
      <p className="text-ink-3 mt-2 text-center text-xs">
        {PLANS[plan].prixFcfa.toLocaleString("fr-FR")} F pour 30 jours, sans reconduction
        automatique.
      </p>
    </>
  );
}
