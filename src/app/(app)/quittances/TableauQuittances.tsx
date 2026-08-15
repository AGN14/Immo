"use client";

import { useMemo, useState } from "react";

export interface LigneQuittance {
  id: string;
  numero: string;
  emiseLe: string;
  periode: string;
  loyerFcfa: number;
  penaliteFcfa: number;
  methode: string;
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
 * Les quittances en tableau, avec filtre.
 *
 * Le filtrage se fait dans le navigateur plutôt que par une requête : un
 * locataire en a au plus quelques dizaines, elles sont déjà chargées, et la
 * réponse est instantanée. Passer par le serveur ajouterait un aller-retour
 * pour trier une liste qu'on a déjà sous la main.
 *
 * La recherche porte sur le mois ET le numéro : on cherche « juillet » quand
 * on prépare un dossier, « 2026-0013 » quand on répond à une réclamation.
 */
export function TableauQuittances({ lignes }: { lignes: LigneQuittance[] }) {
  const [annee, setAnnee] = useState("toutes");
  const [recherche, setRecherche] = useState("");

  const annees = useMemo(
    () => [...new Set(lignes.map((l) => l.periode.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [lignes],
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes.filter((l) => {
      if (annee !== "toutes" && !l.periode.startsWith(annee)) return false;
      if (!q) return true;
      return `${moisFr(l.periode)} ${l.numero}`.toLowerCase().includes(q);
    });
  }, [lignes, annee, recherche]);

  const total = filtrees.reduce((s, l) => s + l.loyerFcfa + l.penaliteFcfa, 0);

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
            <span className="text-ink-2 text-sm font-medium">Rechercher</span>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Mois ou numéro"
              className="border-line bg-surface text-ink placeholder:text-ink-3 focus-visible:outline-primary w-56 rounded-md border px-3 py-2 text-sm focus-visible:outline-2"
            />
          </label>
        </div>

        {/* Le total suit le filtre : c'est ce qu'on vient chercher quand on
            prépare un dossier sur une année précise. */}
        <p className="text-ink-2 text-sm">
          {filtrees.length} quittance{filtrees.length > 1 && "s"} ·{" "}
          <span className="text-ink font-semibold" data-numeric>
            {total.toLocaleString("fr-FR")} F
          </span>
        </p>
      </div>

      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Période</th>
              <th className={th}>N°</th>
              <th className={th}>Montant</th>
              <th className={th}>Moyen</th>
              <th className={th}>Émise le</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {filtrees.length === 0 && (
              <tr>
                <td colSpan={6} className="text-ink-3 px-4 py-12 text-center">
                  Aucune quittance ne correspond à cette recherche.
                </td>
              </tr>
            )}
            {filtrees.map((l) => (
              <tr key={l.id} className="border-line border-b last:border-0">
                <td className="text-ink px-4 py-3 font-semibold">{moisFr(l.periode)}</td>
                <td className="text-ink-2 px-4 py-3" data-numeric>
                  {l.numero}
                </td>
                <td className="px-4 py-3">
                  <span className="text-primary font-semibold" data-numeric>
                    {(l.loyerFcfa + l.penaliteFcfa).toLocaleString("fr-FR")} F
                  </span>
                  {/* L'amende explique un montant supérieur au loyer : sans
                      elle, la ligne passe pour une erreur. */}
                  {l.penaliteFcfa > 0 && (
                    <span className="text-danger block text-xs" data-numeric>
                      dont {l.penaliteFcfa.toLocaleString("fr-FR")} F d&rsquo;amende
                    </span>
                  )}
                </td>
                <td className="text-ink-2 px-4 py-3">{l.methode}</td>
                <td className="text-ink-2 px-4 py-3" data-numeric>
                  {dateFr(l.emiseLe)}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/quittances/${l.numero}`}
                    target="_blank"
                    rel="noopener"
                    className="border-line text-ink hover:border-ink-3 rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap no-underline transition-colors"
                  >
                    Télécharger
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
