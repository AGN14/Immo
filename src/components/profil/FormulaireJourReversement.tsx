"use client";

import { useActionState } from "react";
import { majJourReversement } from "@/lib/actions/compte";
import type { EtatAction } from "@/lib/actions/biens";

/** Réglage du jour de reversement : les loyers collectés sont reversés chaque
 *  mois à cette date. */
export function FormulaireJourReversement({ jour }: { jour: number }) {
  const [etat, action] = useActionState<EtatAction, FormData>(majJourReversement, { ok: true });

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-ink-2 text-sm font-medium">Jour de reversement</span>
        <select
          name="jour"
          defaultValue={jour}
          className="border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          {Array.from({ length: 28 }, (_, i) => i + 1).map((j) => (
            <option key={j} value={j}>
              Le {j} du mois
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Enregistrer
      </button>
      {!etat.ok && <p className="text-danger text-sm">{etat.erreur}</p>}
    </form>
  );
}
