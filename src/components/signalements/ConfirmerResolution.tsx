"use client";

import { useActionState } from "react";
import { confirmerResolution } from "@/lib/actions/signalements";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

/** Le locataire valide la résolution de son signalement. */
export function ConfirmerResolution({ signalementId }: { signalementId: string }) {
  const [etat, action, pendant] = useActionState(
    confirmerResolution.bind(null, signalementId),
    etatInitial,
  );

  return (
    <form action={action} className="mt-3">
      <button
        type="submit"
        disabled={pendant}
        className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {pendant ? "…" : "Confirmer la résolution"}
      </button>
      {etat.erreur && <p className="text-danger mt-2 text-sm">{etat.erreur}</p>}
    </form>
  );
}
