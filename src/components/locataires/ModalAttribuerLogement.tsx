"use client";

import { useActionState, useState } from "react";
import { creerBail } from "@/lib/actions/locataires";
import type { EtatAction } from "@/lib/actions/biens";
import { compositionLabel } from "@/lib/status-labels";
import type { Bien, Lot, Locataire } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const etatInitial: EtatAction = { ok: false };

const selectClass =
  "border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1";

export function ModalAttribuerLogement({
  locataires,
  lotsDisponibles,
  locataireInitial,
  labelBouton = "Attribuer un logement",
}: {
  locataires: Pick<Locataire, "id" | "nom">[];
  lotsDisponibles: { lot: Lot; bien?: Bien }[];
  /** Locataire présélectionné (id) — depuis la ligne « À loger » du tableau. */
  locataireInitial?: string;
  labelBouton?: string;
}) {
  const [ouverture, setOuverture] = useState(0);

  const sansLocataire = locataires.length === 0;
  const sansLogement = lotsDisponibles.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        disabled={sansLocataire || sansLogement}
        className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        title={
          sansLocataire
            ? "Ajoutez d'abord un locataire."
            : sansLogement
              ? "Aucun logement libre pour l'instant."
              : undefined
        }
      >
        {labelBouton}
      </button>

      {ouverture > 0 && (
        <ModalAttribuerLogementInterne
          key={ouverture}
          locataires={locataires}
          lotsDisponibles={lotsDisponibles}
          locataireInitial={locataireInitial}
        />
      )}
    </>
  );
}

/** Remonté à chaque ouverture : l'action repart de zéro, le formulaire aussi. */
function ModalAttribuerLogementInterne({
  locataires,
  lotsDisponibles,
  locataireInitial,
}: {
  locataires: Pick<Locataire, "id" | "nom">[];
  lotsDisponibles: { lot: Lot; bien?: Bien }[];
  locataireInitial?: string;
}) {
  const [ouvert, setOuvert] = useState(true);
  const [etat, action, pendant] = useActionState(creerBail, etatInitial);

  // Fermeture propre après succès : état ajusté pendant le rendu.
  if (etat.ok && ouvert) setOuvert(false);

  return (
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Attribuer un logement">
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Locataire</span>
          <select name="locataireId" className={selectClass} required defaultValue={locataireInitial ?? ""}>
            {!locataireInitial && <option value="">—</option>}
            {locataires.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Logement</span>
          <select name="lotId" className={selectClass} required>
            {lotsDisponibles.map(({ lot, bien }) => (
              <option key={lot.id} value={lot.id}>
                {bien ? `${bien.nom} — ` : ""}
                {lot.nom} ({compositionLabel[lot.composition]})
                {lot.loyerReferenceFcfa
                  ? ` · ${lot.loyerReferenceFcfa.toLocaleString("fr-FR")} F`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Loyer mensuel (F CFA)"
          name="loyerMensuelFcfa"
          type="number"
          min="0"
          step="1"
          required
          placeholder="Ex. 75000"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Date de début" name="dateDebut" type="date" required />
          <Input
            label="Jour d'échéance"
            name="jourEcheance"
            type="number"
            min="1"
            max="31"
            placeholder="Ex. 5"
            hint="Facultatif — règle du propriétaire par défaut."
          />
        </div>

        {etat.erreur && <p className="text-danger text-sm">{etat.erreur}</p>}

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
            disabled={pendant}
            className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {pendant ? "Enregistrement…" : "Créer le bail"}
          </button>
        </div>
      </form>
    </Modal>
  );
}