"use client";

import { useActionState, useState } from "react";
import { modifierBien, type EtatAction } from "@/lib/actions/biens";
import { verifierMotDePasse } from "@/lib/actions/compte";
import { equipementLabel, typeBienLabel } from "@/lib/status-labels";
import type { Bien, TypeBien } from "@/lib/types";
import { ChampPhoto } from "@/components/ui/ChampPhoto";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useWizardEtapes } from "@/components/ui/validation-etapes";
import {
  avecEtages,
  equipementsParType,
  etapesBien,
  selectClass,
  typesDeBien,
} from "@/components/biens/constantes-bien";

const etatInitial: EtatAction = { ok: false };

const labelType = (t: TypeBien) => typeBienLabel[t];
const libelleEquipement = (cle: keyof typeof equipementLabel) => equipementLabel[cle];

/** Modification d'un bien, soumise à la confirmation du mot de passe du
 *  propriétaire : d'abord la vérification, puis le formulaire pré-rempli.
 *  Le mot de passe voyage avec le formulaire : l'action le re-vérifie au
 *  serveur, l'écran n'étant qu'une première barrière. */
export function ModalModifierBien({ bien }: { bien: Bien }) {
  const [ouverture, setOuverture] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
      >
        Modifier
      </button>

      {ouverture > 0 && <ModalModifierBienInterne key={ouverture} bien={bien} />}
    </>
  );
}

function ModalModifierBienInterne({ bien }: { bien: Bien }) {
  const [ouvert, setOuvert] = useState(true);
  const [confirme, setConfirme] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [verif, actionVerif, pendantVerif] = useActionState(verifierMotDePasse, etatInitial);
  const [etat, action, pendant] = useActionState(
    (prev: EtatAction, formData: FormData) => modifierBien(bien.id, prev, formData),
    etatInitial,
  );
  const [type, setType] = useState<TypeBien>(bien.type);
  const { etape, aller, soumettre, formRef } = useWizardEtapes(etapesBien.length);

  // Fermeture propre après succès : état ajusté pendant le rendu.
  if (etat.ok && ouvert) setOuvert(false);
  // Le mot de passe accepté ouvre le formulaire d'édition.
  if (verif.ok && !confirme) setConfirme(true);

  const equipements = equipementsParType[type];
  const estImmeuble = avecEtages.includes(type);

  if (!confirme) {
    return (
      <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Confirmer la modification">
        <p className="text-ink-2 text-sm">
          La modification d&rsquo;un bien est réservée au propriétaire : confirmez votre mot de
          passe pour continuer.
        </p>
        <form action={actionVerif} className="mt-4 flex flex-col gap-4">
          <Input
            label="Mot de passe"
            name="motDePasse"
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          {verif.erreur && <p className="text-danger text-sm">{verif.erreur}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pendantVerif}
              className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {pendantVerif ? "Vérification…" : "Continuer"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre={`Modifier ${bien.nom}`}>
      <form
        ref={formRef}
        action={action}
        noValidate
        onSubmit={soumettre}
        className="flex flex-col gap-4"
      >
        {/* Le mot de passe confirme la modification côté serveur. */}
        <input type="hidden" name="motDePasse" value={motDePasse} />

        <ol className="flex items-center gap-2">
          {etapesBien.map((label, i) => {
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
                {n < etapesBien.length && (
                  <span className="border-line h-px w-4 sm:w-7" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        {/* Étape 1 — identité du bien */}
        <div data-etape={1} className={etape === 1 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nom du bien"
              name="nom"
              placeholder="Ex. Résidence Baobab"
              required
              defaultValue={bien.nom}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-ink-2 text-sm font-medium">Type de bien</span>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as TypeBien)}
                className={selectClass}
              >
                {typesDeBien.map((valeur) => (
                  <option key={valeur} value={valeur}>
                    {labelType(valeur)}
                  </option>
                ))}
              </select>
              <span className="text-ink-3 text-sm">
                Le formulaire s&rsquo;adapte au type choisi.
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={bien.description ?? ""}
              placeholder="Ex. Résidence sécurisée de 3 étages à deux pas de la corniche, avec cours intérieure…"
              className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1"
            />
          </label>
        </div>

        {/* Étape 2 — caractéristiques */}
        <div data-etape={2} className={etape === 2 ? "flex flex-col gap-4" : "hidden"}>
          <ChampPhoto
            nom="image"
            label="Photo du bien"
            accept="image/*"
            apercuInitial={bien.imageUrl}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Superficie (m²)"
              name="superficieM2"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              defaultValue={bien.superficieM2 ?? ""}
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
                defaultValue={bien.etages ?? ""}
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
                      defaultChecked={bien[cle]}
                      className="accent-[var(--color-primary)] size-4"
                    />
                    {libelleEquipement(cle)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {/* Étape 3 — localisation */}
        <div data-etape={3} className={etape === 3 ? "flex flex-col gap-4" : "hidden"}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Adresse"
              name="adresse"
              placeholder="Numéro et rue"
              required
              defaultValue={bien.adresse}
            />
            <Input
              label="Quartier"
              name="quartier"
              placeholder="Ex. Ngor"
              required
              defaultValue={bien.quartier}
            />
          </div>
          <Input
            label="Ville"
            name="ville"
            placeholder="Ex. Dakar"
            required
            defaultValue={bien.ville}
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
                {pendant ? "Enregistrement…" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

