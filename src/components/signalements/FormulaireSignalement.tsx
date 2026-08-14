"use client";

import { useActionState } from "react";
import { creerSignalement } from "@/lib/actions/signalements";
import type { EtatAction } from "@/lib/actions/biens";
import { ChampPhoto } from "@/components/ui/ChampPhoto";

const etatInitial: EtatAction = { ok: false };

const selectClass =
  "border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1";

const urgences = [
  { valeur: "basse", label: "Basse — gênant, peut attendre" },
  { valeur: "normale", label: "Normale — à traiter sous quelques jours" },
  { valeur: "haute", label: "Urgent — fuite, panne d'électricité…" },
];

export function FormulaireSignalement() {
  const [etat, action, pendant] = useActionState(creerSignalement, etatInitial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="titre-signalement" className="text-ink-2 text-sm font-medium">
          Titre
        </label>
        <input
          id="titre-signalement"
          name="titre"
          required
          placeholder="Ex. Fuite d'eau dans la salle de bain"
          className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description-signalement" className="text-ink-2 text-sm font-medium">
          Description
        </label>
        <textarea
          id="description-signalement"
          name="description"
          required
          rows={4}
          placeholder="Décrivez le problème : où, depuis quand, ce que vous avez constaté…"
          className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="urgence-signalement" className="text-ink-2 text-sm font-medium">
          Urgence
        </label>
        <select id="urgence-signalement" name="urgence" defaultValue="normale" className={selectClass}>
          {urgences.map((u) => (
            <option key={u.valeur} value={u.valeur}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <ChampPhoto nom="photo" label="Photo (facultatif)" accept="image/*" />

      {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}
      {etat.ok && (
        <p className="text-primary text-sm" role="status">
          Signalement envoyé — votre propriétaire a été prévenu.
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pendant}
          className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {pendant ? "Envoi…" : "Signaler"}
        </button>
      </div>
    </form>
  );
}
