"use client";

import { useActionState } from "react";
import { majJourReversement } from "@/lib/actions/compte";
import type { EtatAction } from "@/lib/actions/biens";
import { Select } from "@/components/ui/Select";

/** Réglage du jour de reversement : les loyers collectés sont reversés chaque
 *  mois à cette date. */
export function FormulaireJourReversement({ jour }: { jour: number }) {
  const [etat, action] = useActionState<EtatAction, FormData>(majJourReversement, { ok: true });

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <Select
        label="Jour de reversement"
        name="jour"
        defaultValue={String(jour)}
        options={Array.from({ length: 28 }, (_, i) => i + 1).map((j) => ({
          value: String(j),
          label: `Le ${j} du mois`,
        }))}
        className="w-48"
      />
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
