"use client";

import { useActionState, useState } from "react";
import { creerLot, type EtatAction } from "@/lib/actions/biens";
import { compositionLabel } from "@/lib/status-labels";
import type { TypeBien } from "@/lib/types";
import { compositionsParType } from "@/components/biens/constantes-bien";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

const etatInitial: EtatAction = { ok: false };

export function ModalAjouterLot({
  bienId,
  typeBien,
}: {
  bienId: string;
  typeBien: TypeBien;
}) {
  const [ouverture, setOuverture] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
      >
        Ajouter un lot
      </button>

      {ouverture > 0 && (
        <ModalAjouterLotInterne key={ouverture} bienId={bienId} typeBien={typeBien} />
      )}
    </>
  );
}

/** Remonté à chaque ouverture : l'action repart de zéro, le formulaire aussi. */
function ModalAjouterLotInterne({
  bienId,
  typeBien,
}: {
  bienId: string;
  typeBien: TypeBien;
}) {
  const [ouvert, setOuvert] = useState(true);
  const [etat, action, pendant] = useActionState(creerLot.bind(null, bienId), etatInitial);

  // Fermeture propre après succès : état ajusté pendant le rendu.
  if (etat.ok && ouvert) setOuvert(false);

  const compositions = compositionsParType[typeBien];

  return (
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Ajouter un lot">
      <form action={action} className="flex flex-col gap-4">
        <Input label="Nom du lot" name="nom" placeholder="Ex. Appartement A1" required />
        <Select
          label="Composition"
          name="composition"
          defaultValue={compositions[0]}
          options={compositions.map((valeur) => ({ value: valeur, label: compositionLabel[valeur] }))}
        />
        <Input
          label="Loyer de référence (F CFA / mois)"
          name="loyerReferenceFcfa"
          type="number"
          min="0"
          step="1"
          placeholder="Facultatif — ex. 75000"
          hint="Ce que le logement vaut ; le loyer du bail peut différer."
        />

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
            {pendant ? "Enregistrement…" : "Créer le lot"}
          </button>
        </div>
      </form>
    </Modal>
  );
}