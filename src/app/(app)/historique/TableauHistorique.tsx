"use client";

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatutVersement } from "@/lib/types";

export interface LigneHistorique {
  id: string;
  periode: string;
  loyerFcfa: number;
  penaliteFcfa: number;
  methode: string;
  statut: StatutVersement;
  statutLabel: string;
  statutTone: "ok" | "warn" | "mute";
  /** Date de confirmation si elle existe, de déclaration sinon. */
  date: string;
  /** Vrai tant que le propriétaire n'a pas confirmé : rien n'est acquis. */
  enAttente: boolean;
}

const moisFr = (periode: string) =>
  new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

const dateFr = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const th = "text-ink-2 px-4 py-3 text-left text-sm font-medium";

/**
 * L'historique des paiements, en tableau filtrable.
 *
 * Il ne double pas la page des quittances : celle-ci ne montre que les
 * paiements confirmés, puisqu'un paiement non confirmé n'a pas de quittance.
 * Une déclaration en espèces en attente n'apparaîtrait donc nulle part — c'est
 * précisément ce qu'un locataire vient vérifier après avoir remis son argent de
 * la main à la main. D'où la colonne « Statut », qui est la raison d'être de
 * cette page, et l'absence de colonne « Quittance », qui appartient à l'autre.
 *
 * Le total ne compte que le confirmé : additionner une déclaration en attente
 * laisserait croire qu'elle est acquise.
 */
export function TableauHistorique({ lignes }: { lignes: LigneHistorique[] }) {
  const [annee, setAnnee] = useState("toutes");
  const [statut, setStatut] = useState("tous");

  const annees = useMemo(
    () => [...new Set(lignes.map((l) => l.periode.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [lignes],
  );

  const filtrees = useMemo(
    () =>
      lignes.filter((l) => {
        if (annee !== "toutes" && !l.periode.startsWith(annee)) return false;
        if (statut !== "tous" && l.statut !== statut) return false;
        return true;
      }),
    [lignes, annee, statut],
  );

  const confirme = filtrees.filter((l) => l.statut === "confirme");
  const total = confirme.reduce((s, l) => s + l.loyerFcfa + l.penaliteFcfa, 0);
  const amendes = confirme.reduce((s, l) => s + l.penaliteFcfa, 0);
  const enAttente = filtrees.filter((l) => l.enAttente).length;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-sm font-medium">Année</span>
            <select
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            >
              <option value="toutes">Toutes</option>
              {annees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-ink-2 text-sm font-medium">Statut</span>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            >
              <option value="tous">Tous</option>
              <option value="confirme">Confirmé</option>
              <option value="initie">À confirmer</option>
              <option value="echoue">Échoué</option>
              <option value="annule">Annulé</option>
            </select>
          </label>
        </div>

        <p className="text-ink-2 text-right text-sm">
          {confirme.length} mois réglé{confirme.length > 1 && "s"} ·{" "}
          <span className="text-ink font-semibold" data-numeric>
            {total.toLocaleString("fr-FR")} F
          </span>
          {amendes > 0 && (
            <span className="text-danger block text-xs" data-numeric>
              dont {amendes.toLocaleString("fr-FR")} F d&rsquo;amendes
            </span>
          )}
          {enAttente > 0 && (
            <span className="text-ink-3 block text-xs">
              {enAttente} en attente, non compté{enAttente > 1 && "s"}
            </span>
          )}
        </p>
      </div>

      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Mois</th>
              <th className={th}>Montant</th>
              <th className={th}>Moyen</th>
              <th className={th}>Statut</th>
              <th className={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.length === 0 && (
              <tr>
                <td colSpan={5} className="text-ink-3 px-4 py-12 text-center">
                  Aucun paiement ne correspond à ce filtre.
                </td>
              </tr>
            )}
            {filtrees.map((l) => (
              <tr key={l.id} className="border-line border-b last:border-0">
                {/* « 2026-08 » se lisait comme une référence technique. Un mois
                    se nomme. */}
                <td className="text-ink px-4 py-3 font-semibold">{moisFr(l.periode)}</td>
                <td className="px-4 py-3">
                  <span className="text-primary font-semibold" data-numeric>
                    {(l.loyerFcfa + l.penaliteFcfa).toLocaleString("fr-FR")} F
                  </span>
                  {/* Sans cette mention, un mois plus cher que les autres passe
                      pour une erreur de facturation. */}
                  {l.penaliteFcfa > 0 && (
                    <span className="text-danger block text-xs" data-numeric>
                      dont {l.penaliteFcfa.toLocaleString("fr-FR")} F d&rsquo;amende
                    </span>
                  )}
                </td>
                <td className="text-ink-2 px-4 py-3">{l.methode}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={l.statutTone}>{l.statutLabel}</StatusPill>
                </td>
                <td className="text-ink-2 px-4 py-3" data-numeric>
                  {dateFr(l.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
