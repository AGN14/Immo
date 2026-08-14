"use client";

import { useState } from "react";
import { supprimerCompte } from "@/lib/actions/compte";

/** Suppression de compte en deux temps, irréversible pour l'utilisateur :
 *  c'est un soft delete, mais une fois parti, l'adresse ne se reconnecte plus. */
export function SupprimerCompte() {
  const [confirmation, setConfirmation] = useState(false);

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="border-danger text-danger hover:bg-danger hover:text-on-primary rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="border-danger/30 bg-danger-soft/30 flex flex-wrap items-center gap-3 rounded-md border p-3">
      <p className="text-ink text-sm">
        Confirmer la suppression ? Cette action est définitive.
      </p>
      <div className="flex items-center gap-2">
        <form action={supprimerCompte}>
          <button
            type="submit"
            className="bg-danger text-on-primary hover:bg-danger/90 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          >
            Oui, supprimer
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className="border-line text-ink-2 hover:text-ink rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
