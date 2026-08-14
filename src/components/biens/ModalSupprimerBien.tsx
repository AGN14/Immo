"use client";

import { useActionState, useState } from "react";
import { supprimerBien, type EtatAction } from "@/lib/actions/biens";
import { verifierMotDePasse } from "@/lib/actions/compte";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const etatInitial: EtatAction = { ok: false };

/** Suppression d'un bien, soumise à la confirmation du mot de passe du
 *  propriétaire : d'abord la vérification, puis un dernier avertissement.
 *  Le mot de passe voyage avec le formulaire : l'action le re-vérifie au
 *  serveur, l'écran n'étant qu'une première barrière. */
export function ModalSupprimerBien({ bienId }: { bienId: string }) {
  const [ouverture, setOuverture] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverture((o) => o + 1)}
        className="border-danger text-danger hover:bg-danger hover:text-on-primary rounded-md border px-4 py-2.5 text-sm font-medium transition-colors"
      >
        Supprimer
      </button>

      {ouverture > 0 && <ModalSupprimerBienInterne key={ouverture} bienId={bienId} />}
    </>
  );
}

function ModalSupprimerBienInterne({ bienId }: { bienId: string }) {
  const [ouvert, setOuvert] = useState(true);
  const [confirme, setConfirme] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [verif, actionVerif, pendantVerif] = useActionState(verifierMotDePasse, etatInitial);
  const [etat, action, pendant] = useActionState(
    (prev: EtatAction, formData: FormData) => supprimerBien(bienId, prev, formData),
    etatInitial,
  );

  // Fermeture propre après succès : l'action a revalidé, la page n'existe plus.
  if (etat.ok && ouvert) setOuvert(false);
  // Le mot de passe accepté ouvre l'avertissement final.
  if (verif.ok && !confirme) setConfirme(true);

  if (!confirme) {
    return (
      <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Confirmer la suppression">
        <p className="text-ink-2 text-sm">
          La suppression d&rsquo;un bien est réservée au propriétaire : confirmez votre mot de
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
    <Modal ouvert={ouvert} surFermer={() => setOuvert(false)} titre="Supprimer définitivement">
      <p className="text-ink-2 text-sm leading-relaxed">
        Cette action est <strong className="text-ink font-semibold">définitive</strong> : le bien,
        ses lots, ses baux et ses paiements seront supprimés. Les locataires, eux, restent.
      </p>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="motDePasse" value={motDePasse} />

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
            className="bg-danger text-on-primary hover:bg-danger/90 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {pendant ? "Suppression…" : "Supprimer le bien"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
