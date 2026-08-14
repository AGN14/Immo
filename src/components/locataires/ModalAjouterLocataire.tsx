"use client";

import { useActionState, useState } from "react";
import { creerLocataire } from "@/lib/actions/locataires";
import type { EtatAction } from "@/lib/actions/biens";
import type { PieceIdentite } from "@/lib/types";
import { ChampPhoto } from "@/components/ui/ChampPhoto";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useWizardEtapes } from "@/components/ui/validation-etapes";

const etatInitial: EtatAction = { ok: false };

const selectClass =
  "border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1";

const pieces: { valeur: PieceIdentite; label: string }[] = [
  { valeur: "cni", label: "Carte nationale d'identité" },
  { valeur: "passeport", label: "Passeport" },
  { valeur: "permis", label: "Permis de conduire" },
  { valeur: "carte-sejour", label: "Carte de séjour" },
  { valeur: "autre", label: "Autre" },
];

/** Les quatre étapes du dossier locataire, dans l'ordre. */
const etapes = ["Identité", "Contact", "Pièce d'identité", "Suivi du dossier"];

export function ModalAjouterLocataire() {
  const [ouverture, setOuverture] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Ajouter un locataire
      </button>

      {ouverture > 0 && <ModalAjouterLocataireInterne key={ouverture} />}
    </>
  );
}

/** Remonté à chaque ouverture : l'action repart de zéro, le formulaire aussi.
 *  Le dossier locataire est découpé en quatre étapes ; toutes restent montées
 *  dans le DOM (masquées) pour que les valeurs survivent à la navigation.
 *  Le formulaire est en `noValidate` : la validation native du navigateur
 *  échouerait sur les champs masqués (« not focusable »). */
function ModalAjouterLocataireInterne() {
  const [ouvert, setOuvert] = useState(true);
  const [etat, action, pendant] = useActionState(creerLocataire, etatInitial);
  const { etape, aller, soumettre, formRef } = useWizardEtapes(etapes.length);

  // Fermeture propre après succès : état ajusté pendant le rendu.
  if (etat.ok && ouvert) setOuvert(false);

  return (
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Ajouter un locataire">
      <form
        ref={formRef}
        action={action}
        noValidate
        onSubmit={soumettre}
        className="flex flex-col gap-4"
      >
        <ol className="flex items-center gap-2">
          {etapes.map((label, i) => {
            const n = i + 1;
            const fait = n < etape;
            const actif = n === etape;
            return (
              <li key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => aller(n)}
                  aria-current={actif ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors ${
                    actif ? "text-ink" : fait ? "text-ink-2" : "text-ink-3"
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      actif
                        ? "bg-primary text-on-primary"
                        : fait
                          ? "bg-primary-soft text-primary"
                          : "bg-sand text-ink-3"
                    }`}
                    aria-hidden="true"
                  >
                    {fait ? "✓" : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {n < etapes.length && (
                  <span className="border-line h-px w-4 sm:w-7" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        {/* Étape 1 — photo et identité */}
        <div data-etape={1} className={etape === 1 ? "flex flex-col gap-5" : "hidden"}>
          <fieldset>
            <legend className="text-ink-2 mb-2 text-sm font-semibold">Photo</legend>
            <ChampPhoto nom="photo" label="Photo" />
          </fieldset>
          <fieldset>
            <legend className="text-ink-2 mb-2 text-sm font-semibold">Identité</legend>
            <div className="flex flex-col gap-4">
              <Input label="Nom complet" name="nom" placeholder="Ex. Awa Diop" required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Date de naissance"
                  name="dateNaissance"
                  type="date"
                  hint="Facultatif, utile au suivi du dossier."
                />
                <Input
                  label="Profession"
                  name="profession"
                  placeholder="Ex. Commerçante"
                  hint="Facultatif."
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Étape 2 — contact */}
        <div data-etape={2} className={etape === 2 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="E-mail" name="email" type="email" placeholder="Facultatif" />
            <Input
              label="Téléphone"
              name="telephone"
              type="tel"
              placeholder="Ex. +221 77 123 45 67"
              hint="Ce numéro recevra la notification de quittance."
            />
          </div>
        </div>

        {/* Étape 3 — pièce d'identité */}
        <div data-etape={3} className={etape === 3 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-ink-3 text-sm">Type</span>
              <select name="pieceType" defaultValue="" className={selectClass}>
                <option value="">—</option>
                {pieces.map((p) => (
                  <option key={p.valeur} value={p.valeur}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Numéro" name="pieceNumero" placeholder="Ex. 2 2025 010123" />
          </div>
        </div>

        {/* Étape 4 — suivi du dossier */}
        <div data-etape={4} className={etape === 4 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre d'occupants"
              name="occupants"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              placeholder="Ex. 3"
              hint="Combien de personnes vivront dans le logement."
            />
            <Input label="Garant" name="garantNom" placeholder="Nom du garant" hint="Personne de confiance à joindre en cas d'impayé." />
          </div>
          <Input
            label="Téléphone du garant"
            name="garantTelephone"
            type="tel"
            placeholder="Ex. +221 77 987 65 43"
          />
        </div>

        {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <div className="flex items-center gap-3">
            {etape > 1 && (
              <button
                type="button"
                onClick={() => aller(etape - 1)}
                className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Précédent
              </button>
            )}
            {etape < etapes.length ? (
              <button
                type="button"
                onClick={() => aller(etape + 1)}
                className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={pendant}
                className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {pendant ? "Enregistrement…" : "Créer le locataire"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
