"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Le locataire choisit un **nombre de mois**, jamais des mois précis : la
 * résolution serveur part des plus anciens impayés. Le formulaire se contente
 * de montrer lesquels seront couverts, pour qu'il n'y ait pas de surprise.
 */
export function FormulairePaiement({
  action,
  loyerMensuelFcfa,
  mois,
  moisEnRetard,
  echeances,
}: {
  action: (formData: FormData) => void;
  loyerMensuelFcfa: number;
  mois: string[];
  moisEnRetard: string[];
  echeances: string[];
}) {
  const [nombre, setNombre] = useState(Math.max(1, moisEnRetard.length || 1));
  const couverts = mois.slice(0, nombre);
  const total = loyerMensuelFcfa * couverts.length;
  const retard = new Set(moisEnRetard);

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <fieldset className="border-line bg-surface rounded-lg border p-5">
        <legend className="text-ink px-2 text-sm font-semibold">Combien de mois ?</legend>

        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            name="nombreMois"
            min={1}
            max={Math.max(1, mois.length)}
            value={nombre}
            onChange={(e) => setNombre(Number(e.target.value))}
            className="accent-primary flex-1"
            aria-label="Nombre de mois à régler"
          />
          <span
            className="font-display text-primary w-24 text-right text-2xl font-semibold"
            data-numeric
          >
            {nombre} mois
          </span>
        </div>

        <ul className="divide-line-soft border-line-soft mt-4 divide-y border-t text-sm">
          {couverts.map((m, i) => (
            <li key={m} className="flex items-center justify-between py-2">
              <span className="text-ink-2">
                {m}
                {retard.has(m) && <span className="text-danger ml-2 font-semibold">en retard</span>}
              </span>
              <span className="text-ink-3" data-numeric>
                échéance {echeances[i]}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-line mt-4 flex items-baseline justify-between border-t pt-4">
          <span className="text-ink font-semibold">Total à payer</span>
          <span className="font-display text-primary text-3xl font-semibold" data-numeric>
            {total.toLocaleString("fr-FR")} F
          </span>
        </div>
      </fieldset>

      <fieldset className="border-line bg-surface flex flex-col gap-4 rounded-lg border p-5">
        <legend className="text-ink px-2 text-sm font-semibold">Comment avez-vous payé ?</legend>

        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Moyen de paiement</span>
          <select
            name="methode"
            defaultValue="mobile-money"
            className="border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            <option value="mobile-money">Mobile Money</option>
            <option value="virement">Virement</option>
            <option value="especes">Espèces</option>
          </select>
        </label>

        <Input
          label="Référence de la transaction"
          name="reference"
          type="text"
          placeholder="Ex. MP260814.1102.X44219"
          hint="Le code reçu par SMS après votre paiement. Il permet à votre propriétaire de retrouver l'opération."
        />
      </fieldset>

      <Button type="submit" variant="primary" block>
        Déclarer le paiement de {total.toLocaleString("fr-FR")} F
      </Button>
    </form>
  );
}
