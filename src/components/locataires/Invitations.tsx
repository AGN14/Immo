"use client";

import { useActionState, useState } from "react";
import { creerInvitation, revoquerInvitation } from "@/lib/actions/invitations";
import type { EtatAction } from "@/lib/actions/biens";

const etatInitial: EtatAction = { ok: false };

export interface LigneInvitation {
  id: string;
  nom: string | null;
  telephone: string | null;
  lien: string;
  expireLe: string;
  utiliseeLe: string | null;
}

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Invitations : le chemin sûr pour faire entrer un locataire.
 *
 * Aucun envoi automatique. Ici le canal est WhatsApp, pas l'e-mail : on produit
 * un lien et le propriétaire le transmet comme il le fait déjà pour tout le
 * reste. Un envoi par e-mail supposerait que le locataire en relève un, ce qui
 * est loin d'être acquis.
 */
export function Invitations({ lignes }: { lignes: LigneInvitation[] }) {
  const [etat, action, enCours] = useActionState(creerInvitation, etatInitial);
  const [copie, setCopie] = useState<string | null>(null);

  const copier = async (id: string, lien: string) => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(id);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      // Presse-papiers refusé : le lien reste sélectionnable à la main.
    }
  };

  const enAttente = lignes.filter((l) => !l.utiliseeLe);

  return (
    <section className="border-line bg-surface mt-8 rounded-md border p-6">
      <h2 className="font-display text-ink text-xl font-semibold">Inviter un locataire</h2>
      <p className="text-ink-2 mt-1 text-sm">
        Créez un lien nominatif et envoyez-le par WhatsApp. Il vaut sept jours et ne sert
        qu&rsquo;une fois — contrairement au code du bien, qui reste valable pour quiconque le voit.
      </p>

      <form action={action} className="mt-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Nom du locataire</span>
          <input
            type="text"
            name="nom"
            required
            placeholder="Kouadio Yves"
            className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary w-56 rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-ink-2 text-sm font-medium">Téléphone (facultatif)</span>
          <input
            type="tel"
            name="telephone"
            placeholder="+229 01 23 45 67"
            className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary w-48 rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {enCours ? "Création…" : "Créer le lien"}
        </button>
      </form>

      {etat.erreur && (
        <p className="border-danger bg-danger-soft text-ink mt-4 rounded-md border px-3 py-2 text-sm">
          {etat.erreur}
        </p>
      )}

      {enAttente.length > 0 && (
        <ul className="divide-line-soft border-line-soft mt-6 divide-y border-t">
          {enAttente.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-ink text-sm font-semibold">{l.nom ?? "Sans nom"}</p>
                <p className="text-ink-3 text-xs">
                  {l.telephone ? `${l.telephone} · ` : ""}expire le {dateFr(l.expireLe)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => copier(l.id, l.lien)}
                  className="border-line text-ink hover:border-ink-3 rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors"
                >
                  {copie === l.id ? "Lien copié" : "Copier le lien"}
                </button>
                <form action={revoquerInvitation}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    type="submit"
                    className="text-ink-3 hover:text-danger px-2 py-1.5 text-sm transition-colors"
                  >
                    Révoquer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
