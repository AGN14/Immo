"use client";

import { useActionState } from "react";
import { changerStatutSignalement } from "@/lib/actions/signalements";
import type { EtatAction } from "@/lib/actions/biens";
import type { StatutSignalement } from "@/lib/types";

const etatInitial: EtatAction = { ok: false };

/** Les boutons proposés selon l'état du fil. La confirmation finale revient
 *  au locataire : elle n'apparaît jamais ici. */
const actions: Partial<Record<StatutSignalement, { statut: StatutSignalement; label: string; primaire: boolean }[]>> = {
  signale: [
    { statut: "pris-en-charge", label: "Prendre en charge", primaire: true },
    { statut: "annule", label: "Annuler", primaire: false },
  ],
  "pris-en-charge": [
    { statut: "resolu", label: "Marquer résolu", primaire: true },
    { statut: "annule", label: "Annuler", primaire: false },
  ],
};

export function ChangerStatutSignalement({
  signalementId,
  statut,
}: {
  signalementId: string;
  statut: StatutSignalement;
}) {
  const [etat, action, pendant] = useActionState(
    changerStatutSignalement.bind(null, signalementId),
    etatInitial,
  );
  const boutons = actions[statut];
  if (!boutons) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {boutons.map((b) => (
        <form key={b.statut} action={action}>
          <input type="hidden" name="statut" value={b.statut} />
          <button
            type="submit"
            disabled={pendant}
            className={
              b.primaire
                ? "bg-primary text-on-primary hover:bg-primary-hi rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
                : "border-line text-ink hover:border-ink-3 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            }
          >
            {pendant ? "…" : b.label}
          </button>
        </form>
      ))}
      {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}
    </div>
  );
}
