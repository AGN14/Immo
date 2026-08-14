"use client";

import { useActionState, useState } from "react";
import { confirmerVersement } from "@/lib/actions/loyers";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

/** Double confirmation : clic, puis « Confirmer » — un clic ne suffit pas. */
export function BoutonConfirmerVersement({ versementId }: { versementId: string }) {
  const [arme, setArme] = useState(false);
  const [etat, action, pendant] = useActionState(
    confirmerVersement.bind(null, versementId),
    etatInitial,
  );

  if (!arme) {
    return (
      <button
        type="button"
        onClick={() => setArme(true)}
        className="text-primary hover:bg-primary-soft rounded-md px-2 py-1 text-xs font-semibold transition-colors"
      >
        Confirmer
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pendant}
        className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {pendant ? "…" : "Confirmer l'encaissement"}
      </button>
      <button
        type="button"
        onClick={() => setArme(false)}
        className="text-ink-3 hover:text-ink text-xs no-underline"
      >
        Annuler
      </button>
      {etat.erreur && <span className="text-danger text-xs">{etat.erreur}</span>}
    </form>
  );
}