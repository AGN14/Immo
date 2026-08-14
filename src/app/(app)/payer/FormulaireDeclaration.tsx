"use client";

import { useActionState, useState } from "react";
import { declarerVersement } from "@/lib/actions/loyers";
import type { EtatAction } from "@/lib/actions/biens";
import { methodeLabel } from "@/lib/status-labels";

const etatInitial: EtatAction = { ok: false };

const moisLabel = (periode: string) =>
  new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

const methodeClass =
  "border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1";

export function FormulaireDeclaration({
  loyerMensuelFcfa,
  moisDue,
  penalites,
}: {
  loyerMensuelFcfa: number;
  moisDue: string[];
  /**
   * L'amende encourue par mois, indexée par période. Les mois se cochent
   * librement : une liste positionnelle se désaligne au premier décochage.
   */
  penalites: Record<string, number>;
}) {
  const [choisis, setChoisis] = useState<string[]>([moisDue[0]]);
  const [etat, action, pendant] = useActionState(declarerVersement, etatInitial);

  const bascule = (periode: string) =>
    setChoisis((prev) =>
      prev.includes(periode) ? prev.filter((m) => m !== periode) : [...prev, periode],
    );

  const loyers = choisis.length * loyerMensuelFcfa;
  const amendes = choisis.reduce((somme, periode) => somme + (penalites[periode] ?? 0), 0);
  const montant = loyers + amendes;
  const moisPenalises = choisis.filter((periode) => (penalites[periode] ?? 0) > 0).length;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <p className="text-ink-2 text-sm font-medium">Mois à régler</p>
        <p className="text-ink-3 mt-0.5 text-sm">
          Le paiement couvre les mois les plus anciens d&rsquo;abord, dans l&rsquo;ordre.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {moisDue.map((periode) => (
            <label
              key={periode}
              className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                choisis.includes(periode)
                  ? "border-primary bg-primary-soft text-ink"
                  : "border-line bg-surface text-ink-2 hover:border-ink-3"
              }`}
            >
              <input
                type="checkbox"
                name="mois"
                value={periode}
                checked={choisis.includes(periode)}
                onChange={() => bascule(periode)}
                className="sr-only"
              />
              {moisLabel(periode)}
              {(penalites[periode] ?? 0) > 0 && (
                <span className="text-danger ml-2 font-semibold" data-numeric>
                  + {penalites[periode].toLocaleString("fr-FR")} F
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Moyen de paiement</span>
          <select name="methode" className={methodeClass} required>
            {Object.entries(methodeLabel).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Référence (facultatif)</span>
          <input
            name="referenceExterne"
            placeholder="Ex. transaction Wave 88-776-221"
            className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
          />
        </label>
      </div>

      <div className="border-line bg-sand rounded-md border p-4">
        <p className="text-ink-3 text-sm">Total à déclarer</p>
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
        <input type="hidden" name="montantFcfa" value={String(montant)} />
      </div>

      {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}
      {etat.ok && (
        <p className="text-success text-sm">
          Déclaration enregistrée. Votre propriétaire la confirmera ; la quittance sera émise à ce
          moment-là.
        </p>
      )}

      <button
        type="submit"
        disabled={pendant || choisis.length === 0}
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {pendant ? "Enregistrement…" : "Déclarer le paiement"}
      </button>
    </form>
  );
}
