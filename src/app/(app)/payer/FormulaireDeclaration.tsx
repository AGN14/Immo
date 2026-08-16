"use client";

import { useActionState, useState } from "react";
import { declarerVersement } from "@/lib/actions/loyers";
import type { EtatAction } from "@/lib/actions/biens";
import { BoutonKkiapay } from "@/app/(app)/payer/BoutonKkiapay";

const etatInitial: EtatAction = { ok: false };

const moisLabel = (periode: string) =>
  new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

/**
 * Le locataire choisit un NOMBRE de mois, pas des mois précis.
 *
 * Les cases à cocher qui précédaient laissaient composer n'importe quelle
 * combinaison — dont celles que le serveur refuse. Un loyer se règle dans
 * l'ordre : payer septembre en devant août masquerait l'arriéré, fausserait le
 * calcul des pénalités et affaiblirait le préavis. Le serveur l'imposait déjà,
 * mais l'écran proposait le contraire, et le paiement échouait après
 * encaissement.
 *
 * Un compteur règle les deux : l'ordre est structurellement respecté, et le
 * plafond de trois mois disparaît — quelqu'un peut vouloir solder son année.
 */
export function FormulaireDeclaration({
  loyerMensuelFcfa,
  moisDue,
  penalites,
  kkiapay,
  nomLocataire,
  nomProprietaire,
}: {
  loyerMensuelFcfa: number;
  /** Les échéances réglables, du plus ancien au plus récent. */
  moisDue: string[];
  /** L'amende encourue par mois, indexée par période. */
  penalites: Record<string, number>;
  kkiapay?: { clePublique: string; bacASable: boolean };
  nomLocataire: string;
  /** Nommer le bailleur vaut mieux qu'un « votre propriétaire » impersonnel :
   *  le locataire sait qui doit confirmer, et à qui s'adresser. */
  nomProprietaire: string;
}) {
  // On part du nombre d'arriérés : c'est ce que le locataire vient régler.
  const enRetard = moisDue.filter((m) => (penalites[m] ?? 0) > 0).length;
  const [nombre, setNombre] = useState(Math.max(1, enRetard));
  const [etat, action, pendant] = useActionState(declarerVersement, etatInitial);

  const maximum = moisDue.length;
  const choisis = moisDue.slice(0, nombre);

  const loyers = choisis.length * loyerMensuelFcfa;
  const amendes = choisis.reduce((somme, m) => somme + (penalites[m] ?? 0), 0);
  const montant = loyers + amendes;
  const moisPenalises = choisis.filter((m) => (penalites[m] ?? 0) > 0).length;

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Chaque mois retenu part en champ caché : le serveur revalidera qu'ils
          correspondent bien aux plus anciens dus. */}
      {choisis.map((m) => (
        <input key={m} type="hidden" name="mois" value={m} />
      ))}
      <input type="hidden" name="montantFcfa" value={String(montant)} />

      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-ink-2 text-sm font-medium">Combien de mois réglez-vous ?</p>
          <span className="font-display text-primary text-2xl font-semibold" data-numeric>
            {nombre}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={maximum}
          value={nombre}
          onChange={(e) => setNombre(Number(e.target.value))}
          className="accent-primary mt-3 w-full"
          aria-label="Nombre de mois à régler"
        />
        <div className="text-ink-3 mt-1 flex justify-between text-xs">
          <span>1 mois</span>
          <span>{maximum} mois</span>
        </div>

        {/* L'explication manquait : rien ne disait pourquoi on ne choisit pas
            librement son mois. Sans elle, la règle passe pour un défaut. */}
        {enRetard > 0 && (
          <p className="border-line bg-sand text-ink-2 mt-4 rounded-md border p-3 text-sm">
            Vous avez <strong className="text-ink font-semibold">{enRetard} mois en retard</strong>.
            Les loyers se règlent du plus ancien au plus récent : votre paiement les soldera
            d&rsquo;abord.
          </p>
        )}
      </div>

      <div>
        <p className="text-ink-2 text-sm font-medium">Mois couverts</p>
        <ul className="divide-line-soft border-line-soft mt-2 divide-y border-t text-sm">
          {choisis.map((m) => (
            <li key={m} className="flex items-center justify-between py-2">
              <span className="text-ink-2">{moisLabel(m)}</span>
              <span className="flex items-baseline gap-3" data-numeric>
                {(penalites[m] ?? 0) > 0 && (
                  <span className="text-danger font-semibold">
                    + {penalites[m].toLocaleString("fr-FR")} F d&rsquo;amende
                  </span>
                )}
                <span className="text-ink-3">{loyerMensuelFcfa.toLocaleString("fr-FR")} F</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-line bg-sand rounded-md border p-4">
        <p className="text-ink-3 text-sm">Total</p>
        <p className="font-display text-primary text-3xl font-semibold" data-numeric>
          {montant.toLocaleString("fr-FR")} F
        </p>
        <p className="text-ink-3 mt-1 text-sm">
          {choisis.length} mois × {loyerMensuelFcfa.toLocaleString("fr-FR")} F
          {amendes > 0 && (
            <span className="text-danger font-semibold">
              {" "}
              + {amendes.toLocaleString("fr-FR")} F d&rsquo;amende ({moisPenalises} mois en retard)
            </span>
          )}
        </p>
      </div>

      {kkiapay && (
        <BoutonKkiapay
          montantFcfa={montant}
          mois={choisis}
          clePublique={kkiapay.clePublique}
          bacASable={kkiapay.bacASable}
          nomLocataire={nomLocataire}
        />
      )}

      {etat.erreur && (
        <p className="border-danger bg-danger-soft text-ink rounded-md border p-3 text-sm">
          {etat.erreur}
        </p>
      )}
      {etat.ok && (
        <p className="text-success text-sm">
          Déclaration enregistrée. Votre propriétaire la confirmera ; la quittance sera émise à ce
          moment-là.
        </p>
      )}

      {/* Espèces uniquement. Le Mobile Money passe par le paiement en ligne
          ci-dessus, et le virement n'est pas d'usage courant ici : offrir les
          trois donnait un choix factice, et laissait déclarer « Mobile Money »
          un paiement que la plateforme aurait dû encaisser elle-même. */}
      <details className="border-line-soft border-t pt-4">
        <summary className="text-ink-2 hover:text-ink cursor-pointer text-sm">
          J&rsquo;ai payé en espèces, de la main à la main
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          {/* Le temps des verbes se contredisait : le curseur demande « combien
              réglez-vous » au présent, cette section parle d'un paiement déjà
              fait. On rappelle donc explicitement ce qui sera déclaré. */}
          {/* Aucun champ à remplir : la méthode est connue, et un paiement en
              espèces n'a pas de référence de transaction. */}
          <input type="hidden" name="methode" value="especes" />

          <p className="text-ink-2 text-sm">
            Vous déclarez avoir remis{" "}
            <strong className="text-ink font-semibold" data-numeric>
              {montant.toLocaleString("fr-FR")} F
            </strong>{" "}
            en espèces à {nomProprietaire}, pour {choisis.length} mois —{" "}
            {choisis.map(moisLabel).join(", ")}. Ajustez le curseur ci-dessus si ce n&rsquo;est pas
            le bon nombre.
          </p>
          <p className="text-ink-3 text-sm">
            Il devra confirmer avoir reçu la somme avant que la quittance ne soit émise —
            contrairement au paiement en ligne, qui l&rsquo;émet immédiatement.
          </p>

          <button
            type="submit"
            disabled={pendant}
            className="border-line text-ink hover:border-ink-3 self-start rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {/* Le montant n'est plus répété : il est écrit deux fois au-dessus,
                dans le total et dans la phrase de rappel. */}
            {pendant ? "Enregistrement…" : "Déclarer ce paiement"}
          </button>
        </div>
      </details>
    </form>
  );
}
