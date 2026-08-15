"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { souscrireAbonnement } from "@/lib/actions/abonnement";
import { PLANS, type PlanId } from "@/lib/plans";
import type { ReponseKkiapay } from "@/app/(app)/payer/BoutonKkiapay";

/**
 * Un seul propriétaire pour le paiement d'abonnement de toute la page.
 *
 * Le SDK KKiaPay ne garde qu'UN écouteur de succès : chaque
 * `addSuccessListener` remplace le précédent. Trois boutons qui s'enregistrent
 * chacun, c'est deux écouteurs perdus — et l'état (chargement, erreur) qui
 * s'affiche sur la carte du dernier inscrit plutôt que sur celle qu'on a
 * cliquée. C'est précisément ce qui s'est produit : paiement du palier Pro,
 * message d'échec sur la carte Business.
 *
 * L'écouteur, l'état et le message vivent donc ici, une seule fois. Les boutons
 * ne font plus qu'ouvrir le widget.
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
  clePublique,
  bacASable,
  nomProprietaire,
  children,
}: {
  /** Absente si l'intégration n'est pas configurée : la page se rend alors
   *  telle quelle, sans paiement en ligne. */
  clePublique?: string;
  bacASable: boolean;
  nomProprietaire: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [encours, setEncours] = useState<PlanId | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [vise, setVise] = useState<PlanId | null>(null);

  useEffect(() => {
    if (!pret || !window.addSuccessListener) return;

    window.addSuccessListener(async (reponse: ReponseKkiapay) => {
      if (!vise) return;

      // Le SDK ne documente pas le nom de ce champ et l'a déjà changé : on
      // accepte les variantes plausibles plutôt que d'en figer une seule.
      const reference =
        reponse.transactionId ?? reponse.transaction_id ?? reponse.id ?? reponse.reference;

      if (!reference) {
        setErreur(
          "Paiement encaissé, mais l'opérateur n'a pas renvoyé de référence exploitable. Contactez le support.",
        );
        return;
      }

      setEncours(vise);
      setErreur(null);
      const etat = await souscrireAbonnement(String(reference), vise);
      setEncours(null);

      if (etat.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErreur(`${etat.erreur ?? "Enregistrement impossible."} Référence : ${reference}.`);
      }
    });

    window.addFailedListener?.(() => {
      setErreur("Le paiement n'a pas abouti. Aucun montant n'a été débité.");
    });
  }, [pret, vise, router]);

  const ouvrir = useCallback(
    (plan: PlanId) => {
      if (!clePublique) return;
      setErreur(null);
      setVise(plan);
      window.openKkiapayWidget?.({
        amount: PLANS[plan].prixFcfa,
        key: clePublique,
        sandbox: bacASable,
        position: "center",
        theme: "#1f6f5c",
        name: nomProprietaire,
        data: JSON.stringify({ plan }),
      });
    },
    [clePublique, bacASable, nomProprietaire],
  );

  return (
    <ContextePaiement.Provider value={{ ouvrir, pret: pret && Boolean(clePublique), encours }}>
      {clePublique && (
        <Script src="https://cdn.kkiapay.me/k.js" onReady={() => setPret(true)} />
      )}

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
        {actif ? "Activation…" : libelle}
      </button>
      <p className="text-ink-3 mt-2 text-center text-xs">
        {PLANS[plan].prixFcfa.toLocaleString("fr-FR")} F pour 30 jours, sans reconduction
        automatique.
      </p>
    </>
  );
}
