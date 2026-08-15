"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { encaisserPaiementEnLigne } from "@/lib/actions/paiement-en-ligne";

/**
 * Paiement en ligne par KKiaPay.
 *
 * Le widget encaisse et rend la main avec un identifiant de transaction. Cet
 * identifiant est le SEUL élément qu'on transmet au serveur : ni le montant,
 * ni le statut, qui seraient invérifiables depuis le navigateur. Le serveur
 * recalcule ce qui est dû et interroge KKiaPay lui-même.
 *
 * Le montant passé au widget vient du serveur — il est affiché, jamais saisi.
 */

/**
 * Le SDK ne documente pas la forme exacte de la réponse de succès, et le champ
 * porteur de la référence a déjà changé de nom selon les versions. On accepte
 * donc les variantes plausibles plutôt que d'en figer une seule.
 */
export type ReponseKkiapay = {
  transactionId?: string;
  transaction_id?: string;
  id?: string;
  reference?: string;
};

type Kkiapay = {
  openKkiapayWidget: (o: Record<string, unknown>) => void;
  /** N'EMPILE PAS : chaque appel remplace l'écouteur précédent. */
  addSuccessListener: (cb: (r: ReponseKkiapay) => void) => void;
  addFailedListener: (cb: (r: unknown) => void) => void;
};

declare global {
  interface Window {
    openKkiapayWidget?: Kkiapay["openKkiapayWidget"];
    addSuccessListener?: Kkiapay["addSuccessListener"];
    addFailedListener?: Kkiapay["addFailedListener"];
  }
}

export function BoutonKkiapay({
  montantFcfa,
  mois,
  clePublique,
  bacASable,
  nomLocataire,
}: {
  montantFcfa: number;
  mois: string[];
  clePublique: string;
  bacASable: boolean;
  nomLocataire: string;
}) {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [encours, setEncours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!pret || !window.addSuccessListener) return;

    window.addSuccessListener(async (reponse) => {
      const reference =
        reponse.transactionId ?? reponse.transaction_id ?? reponse.id ?? reponse.reference;

      if (!reference) {
        setErreur(
          "Paiement encaissé, mais l'opérateur n'a pas renvoyé de référence exploitable. Contactez votre propriétaire.",
        );
        return;
      }

      setEncours(true);
      setErreur(null);
      const etat = await encaisserPaiementEnLigne(String(reference), mois);
      setEncours(false);

      if (etat.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // L'argent peut avoir été prélevé alors que l'enregistrement échoue :
        // on le dit, plutôt que de laisser croire à un échec de paiement.
        setErreur(
          `${etat.erreur ?? "Enregistrement impossible."} Votre paiement a peut-être été débité — contactez votre propriétaire avec la référence ${reference}.`,
        );
      }
    });

    window.addFailedListener?.(() => {
      setErreur("Le paiement n'a pas abouti. Aucun montant n'a été débité.");
    });
  }, [pret, mois, router]);

  const ouvrir = () => {
    setErreur(null);
    window.openKkiapayWidget?.({
      amount: montantFcfa,
      key: clePublique,
      sandbox: bacASable,
      position: "center",
      theme: "#1f6f5c",
      name: nomLocataire,
      data: JSON.stringify({ mois }),
    });
  };

  return (
    <>
      <Script src="https://cdn.kkiapay.me/k.js" onReady={() => setPret(true)} />

      <button
        type="button"
        onClick={ouvrir}
        disabled={!pret || encours || montantFcfa <= 0}
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta w-full rounded-md px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {encours
          ? "Enregistrement…"
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
