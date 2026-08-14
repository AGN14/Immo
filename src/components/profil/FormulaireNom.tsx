"use client";

import { useActionState } from "react";
import { majNom } from "@/lib/actions/compte";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

export function FormulaireNom({ nom }: { nom: string }) {
  const [etat, action, pendant] = useActionState(majNom, etatInitial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-ink-2 text-sm font-medium">Nom affiché</span>
        <input
          name="nom"
          defaultValue={nom}
          required
          className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
        />
      </label>
      {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}
      {etat.ok && <p className="text-success text-sm">Nom mis à jour.</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pendant}
          className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {pendant ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
