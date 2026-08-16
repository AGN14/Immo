"use client";

import { useActionState, useState } from "react";
import { terminerBail } from "@/lib/actions/locataires";
import type { EtatAction } from "@/lib/actions/biens";
import { DatePicker } from "@/components/ui/DatePicker";

const etatInitial: EtatAction = { ok: false };

/** Forme réduite, dépliée sur demande : la date de fin + confirmation. */
export function FormulaireTerminerBail({
  bailId,
  dateDebut,
}: {
  bailId: string;
  dateDebut?: string;
}) {
  const [deplie, setDeplie] = useState(false);
  const [etat, action, pendant] = useActionState(
    terminerBail.bind(null, bailId),
    etatInitial,
  );

  if (!deplie) {
    return (
      <button
        type="button"
        onClick={() => setDeplie(true)}
        className="border-line text-ink-3 hover:text-danger hover:border-danger rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
      >
        Terminer le bail
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <DatePicker
          name="dateFin"
          required
          min={dateDebut}
          ariaLabel="Date de fin du bail"
          compact
        />
        <button
          type="submit"
          disabled={pendant}
          className="border-danger text-danger hover:bg-danger hover:text-on-primary rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
        >
          {pendant ? "…" : "Confirmer"}
        </button>
      </div>
      {etat.erreur && <p className="text-danger text-xs">{etat.erreur}</p>}
      <button
        type="button"
        onClick={() => setDeplie(false)}
        className="text-ink-3 hover:text-ink text-xs no-underline"
      >
        Annuler
      </button>
    </form>
  );
}
