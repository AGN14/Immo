"use client";

import { useActionState, useState } from "react";
import { majMotDePasse } from "@/lib/actions/compte";
import type { EtatAction } from "@/lib/actions/biens";
import { Input } from "@/components/ui/Input";

const etatInitial: EtatAction = { ok: false };

/** Définition ou changement du mot de passe du propriétaire, depuis le profil.
 *  Le mot de passe sert à confirmer les actions sensibles (modification d'un
 *  bien) : il est requis au premier enregistrement, exigé ensuite pour changer. */
export function FormulaireMotDePasse({ aMotDePasse }: { aMotDePasse: boolean }) {
  const [etat, action, pendant] = useActionState(majMotDePasse, etatInitial);
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={action} className="flex flex-col gap-4">
      {aMotDePasse && (
        <Input
          label="Mot de passe actuel"
          name="actuel"
          type="password"
          required
          autoComplete="current-password"
          hint="Requis pour définir un nouveau mot de passe."
        />
      )}
      <Input
        label={aMotDePasse ? "Nouveau mot de passe" : "Mot de passe"}
        name="nouveau"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        hint="Au moins 6 caractères."
      />
      <Input
        label="Confirmation"
        name="confirmation"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />

      {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}
      {etat.ok && (
        <p className="text-success text-sm">
          {aMotDePasse ? "Mot de passe modifié." : "Mot de passe enregistré."}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pendant || confirmation.length < 6}
          className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {pendant ? "Enregistrement…" : aMotDePasse ? "Modifier le mot de passe" : "Définir le mot de passe"}
        </button>
      </div>
    </form>
  );
}
