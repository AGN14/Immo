"use client";

import { useActionState } from "react";
import { creerGestionnaire, supprimerGestionnaire } from "@/lib/actions/business";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

/** Formulaire d'ajout d'un membre de l'équipe de gestion. */
export function FormulaireAjoutGestionnaire() {
  const [etat, action, pendant] = useActionState(creerGestionnaire, etatInitial);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
      <label className="block">
        <span className="text-ink-2 mb-1 block text-xs font-medium">Nom complet</span>
        <input
          type="text"
          name="nom"
          required
          placeholder="Ex. Awa Kossou"
          className="border-line text-ink placeholder:text-ink-3 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
        />
      </label>
      <label className="block">
        <span className="text-ink-2 mb-1 block text-xs font-medium">E-mail</span>
        <input
          type="email"
          name="email"
          placeholder="awa@exemple.bj"
          className="border-line text-ink placeholder:text-ink-3 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
        />
      </label>
      <label className="block">
        <span className="text-ink-2 mb-1 block text-xs font-medium">Téléphone</span>
        <input
          type="tel"
          name="telephone"
          placeholder="+229 97 12 34 56"
          className="border-line text-ink placeholder:text-ink-3 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
        />
      </label>
      <button
        type="submit"
        disabled={pendant}
        className="bg-primary text-primary-ink inline-block rounded-md px-4 py-2 text-sm font-semibold no-underline disabled:opacity-60"
      >
        {pendant ? "Enregistrement…" : "Ajouter"}
      </button>
      {etat.erreur && (
        <p className="text-danger sm:col-span-4 text-sm">{etat.erreur}</p>
      )}
      {etat.ok && (
        <p className="text-ink-2 sm:col-span-4 text-sm">
          Membre ajouté à l&rsquo;équipe de gestion.
        </p>
      )}
    </form>
  );
}

/** Bouton de retrait d'un membre de l'équipe. */
export function BoutonSupprimerGestionnaire({ id }: { id: string }) {
  const [etat, action, pendant] = useActionState(supprimerGestionnaire, etatInitial);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendant}
        className="text-danger hover:bg-danger/10 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
      >
        {pendant ? "Retrait…" : "Retirer"}
      </button>
      {etat.erreur && <p className="text-danger mt-1 text-xs">{etat.erreur}</p>}
    </form>
  );
}