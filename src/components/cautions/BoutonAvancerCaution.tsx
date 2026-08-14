"use client";

import { useActionState } from "react";
import { avancerCaution } from "@/lib/actions/business";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

const libelles: Record<string, string> = {
  due: "Marquer encaissée",
  encaisee: "Marquer restituée",
  restituee: null as unknown as string,
};

/** Bouton qui fait avancer la caution : due → encaissée → restituée. */
export function BoutonAvancerCaution({ cautionId, statut }: { cautionId: string; statut: string }) {
  const [etat, action, pendant] = useActionState(avancerCaution, etatInitial);

  const libelle = libelles[statut];
  if (!libelle) return null;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={cautionId} />
      <button
        type="submit"
        disabled={pendant}
        className="border-line text-ink hover:border-ink-3 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {pendant ? "Enregistrement…" : libelle}
      </button>
      {etat.erreur && <p className="text-danger mt-1 text-xs">{etat.erreur}</p>}
    </form>
  );
}