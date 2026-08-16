"use client";

import { useActionState, useState } from "react";
import { creerBien, type EtatAction } from "@/lib/actions/biens";
import { equipementLabel, typeBienLabel } from "@/lib/status-labels";
import type { TypeBien } from "@/lib/types";
import { ChampPhoto } from "@/components/ui/ChampPhoto";
import { EtapesWizard } from "@/components/ui/EtapesWizard";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useWizardEtapes } from "@/components/ui/validation-etapes";
import {
  avecEtages,
  equipementsParType,
  etapesBien,
  typesDeBien,
} from "@/components/biens/constantes-bien";

const etatInitial: EtatAction = { ok: false };

export function ModalAjouterBien() {
  const [ouverture, setOuverture] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        Ajouter un bien
      </button>

      {ouverture > 0 && <ModalAjouterBienInterne key={ouverture} />}
    </>
  );
}

/** Remonté à chaque ouverture : l'action repart de zéro, le formulaire aussi.
 *  Le formulaire est trop long pour un seul écran : il est découpé en trois
 *  étapes. Toutes les étapes restent montées dans le DOM (masquées) pour que
 *  les valeurs saisies survivent à la navigation. Le formulaire est en
 *  `noValidate` et chaque étape se valide seule : la validation native du
 *  navigateur échouerait sur les champs masqués (le focus est refusé aux
 *  éléments cachés — « not focusable »). */
function ModalAjouterBienInterne() {
  const [ouvert, setOuvert] = useState(true);
  const [etat, action, pendant] = useActionState(creerBien, etatInitial);
  const [type, setType] = useState<TypeBien>("immeuble");
  const { etape, aller, soumettre, formRef } = useWizardEtapes(etapesBien.length);

  // Fermeture propre après succès : état ajusté pendant le rendu.
  if (etat.ok && ouvert) setOuvert(false);

  const equipements = equipementsParType[type];
  const estImmeuble = avecEtages.includes(type);

  return (
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Ajouter un bien">
      <form
        ref={formRef}
        action={action}
        noValidate
        onSubmit={soumettre}
        className="flex flex-col gap-4"
      >
        <EtapesWizard etapes={etapesBien} etape={etape} aller={aller} />

        {/* Étape 1 — identité du bien */}
        <div data-etape={1} className={etape === 1 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nom du bien" name="nom" placeholder="Ex. Résidence Baobab" required />
            <Select
              label="Type de bien"
              name="type"
              value={type}
              onChange={(v) => setType(v as TypeBien)}
              options={typesDeBien.map((valeur) => ({ value: valeur, label: typeBienLabel[valeur] }))}
              hint="Le formulaire s’adapte au type choisi."
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Ex. Résidence sécurisée de 3 étages à deux pas de la corniche, avec cours intérieure…"
              className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
            />
          </label>
        </div>

        {/* Étape 2 — caractéristiques */}
        <div data-etape={2} className={etape === 2 ? "flex flex-col gap-4" : "hidden"}>
          <ChampPhoto nom="image" label="Photo du bien" accept="image/*" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Superficie (m²)"
              name="superficieM2"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              placeholder="Ex. 120"
              hint="La surface habitable, si vous la connaissez."
            />
            {estImmeuble && (
              <Input
                label="Nombre d'étages"
                name="etages"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                placeholder="Ex. 3"
                hint="En incluant le rez-de-chaussée."
              />
            )}
          </div>

          {equipements.length > 0 && (
            <fieldset>
              <legend className="text-ink-2 text-sm font-medium">Équipements</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {equipements.map((cle) => (
                  <label
                    key={cle}
                    className="border-line bg-surface text-ink-2 hover:border-ink-3 flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <input
                      type="checkbox"
                      name={cle}
                      value="on"
                      className="accent-[var(--color-primary)] size-4"
                    />
                    {equipementLabel[cle]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {/* Étape 3 — localisation */}
        <div data-etape={3} className={etape === 3 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Adresse" name="adresse" placeholder="Numéro et rue" required />
            <Input label="Quartier" name="quartier" placeholder="Ex. Fidjrossè" required />
          </div>
          <Input label="Ville" name="ville" placeholder="Ex. Cotonou" required />
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
            {etape < etapesBien.length ? (
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
                {pendant ? "Enregistrement…" : "Créer le bien"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
