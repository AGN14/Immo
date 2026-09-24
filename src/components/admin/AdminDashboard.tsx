/**
 * Dashboard admin — TanStack en frontend, Supabase en backend.
 *
 * - TanStack Query : les trois onglets lisent /api/admin/* (données fraîches,
 *   revalidation à la demande, états chargement/erreur intégrés).
 * - TanStack Table : tri, recherche et pagination des comptes et abonnements,
 *   côté client sur le jeu déjà chargé.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { KPICard } from "@/components/ui/KPICard";
import {
  Badge,
  formaterDate,
  formaterMontant,
  libelleStatutAbo,
  libelleStatutCompte,
  tonPlan,
  tonStatutAbo,
  tonStatutCompte,
} from "@/components/admin/ui";
import type {
  AdminAbonnement,
  AdminCompte,
  AdminOverview,
  AlerteCompte,
} from "@/lib/admin/types";

/* ------------------------------------------------------------ utilitaires */

async function lireJson<T>(url: string): Promise<T> {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`Erreur ${reponse.status}`);
  return reponse.json() as Promise<T>;
}

function Bloc({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: React.ReactNode }) {
  return (
    <section className="border-line bg-surface rounded-md border p-5">
      <h2 className="font-display text-ink text-xl font-semibold">{titre}</h2>
      {sousTitre && <p className="text-ink-3 mt-1 text-sm">{sousTitre}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ barres */

function Barres({
  valeurs,
  etiquettes,
  formater,
}: {
  valeurs: number[];
  etiquettes: string[];
  formater: (n: number) => string;
}) {
  const max = Math.max(...valeurs, 1);
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Évolution sur 12 mois">
      {valeurs.map((v, i) => (
        <div key={etiquettes[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${etiquettes[i]} : ${formater(v)}`}>
          <div className="flex h-28 w-full items-end">
            <div
              className="bg-primary w-full rounded-t-sm"
              style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-ink-3 text-[10px]">{etiquettes[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- vue d'ensemble */

function CarteAlerte({ titre, elements }: { titre: string; elements: AlerteCompte[] }) {
  return (
    <div className="border-line bg-surface rounded-md border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-ink text-sm font-semibold">{titre}</h3>
        <span className="text-ink-3 text-xs font-semibold" data-numeric>
          {elements.length}
        </span>
      </div>
      {elements.length === 0 ? (
        <p className="text-ink-3 mt-2 text-sm">Rien à signaler.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {elements.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-ink font-medium">{e.nom}</span>{" "}
              <span className="text-ink-3">{e.email}</span>
              <span className="text-ink-2 block text-xs">{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VueEnsemble() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => lireJson<AdminOverview>("/api/admin/overview"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des indicateurs…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Vue d&apos;ensemble indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const deltaRevenu =
    data.revenuMoisPrecedent > 0
      ? ((data.revenuMois - data.revenuMoisPrecedent) / data.revenuMoisPrecedent) * 100
      : undefined;
  const totalRepartition = Math.max(
    data.repartition.essentiel + data.repartition.pro + data.repartition.business,
    1,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="MRR"
          value={formaterMontant(data.mrr)}
          caption="Revenu mensuel récurrent"
          icon={<span aria-hidden="true">◆</span>}
          tendance={data.serieRevenus.map((s) => s.montant)}
        />
        <KPICard
          label="Encaissé ce mois"
          value={formaterMontant(data.revenuMois)}
          caption={`Mois dernier : ${formaterMontant(data.revenuMoisPrecedent)}`}
          icon={<span aria-hidden="true">●</span>}
          delta={deltaRevenu}
          tendance={data.serieRevenus.map((s) => s.montant)}
        />
        <KPICard
          label="Comptes"
          value={String(data.totaux.comptes)}
          caption={`+${data.totaux.nouveauxJ7} cette semaine · +${data.totaux.nouveauxJ30} ce mois`}
          icon={<span aria-hidden="true">▲</span>}
          tendance={data.serieInscriptions.map((s) => s.nb)}
        />
        <KPICard
          label="Conversion payant"
          value={`${data.conversion}%`}
          caption={`${data.payants} propriétaires ont déjà payé`}
          icon={<span aria-hidden="true">★</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bloc titre="Revenus" sousTitre="Abonnements encaissés, 12 derniers mois">
          <Barres
            valeurs={data.serieRevenus.map((s) => s.montant)}
            etiquettes={data.serieRevenus.map((s) => s.label)}
            formater={formaterMontant}
          />
          <p className="text-ink-3 mt-3 text-sm">
            Total encaissé : <span className="text-ink font-semibold" data-numeric>{formaterMontant(data.totalEncaisse)}</span>
          </p>
        </Bloc>
        <Bloc titre="Inscriptions" sousTitre="Nouveaux comptes, 12 derniers mois">
          <Barres
            valeurs={data.serieInscriptions.map((s) => s.nb)}
            etiquettes={data.serieInscriptions.map((s) => s.label)}
            formater={(n) => `${n} compte${n > 1 ? "s" : ""}`}
          />
          <p className="text-ink-3 mt-3 text-sm">
            Parc suivi : <span className="text-ink font-semibold" data-numeric>{data.totaux.bauxActifs} baux actifs</span> ·{" "}
            {data.totaux.biens} biens · {data.totaux.lots} lots · {data.totaux.locataires} locataires
          </p>
        </Bloc>
        <Bloc titre="Plans effectifs" sousTitre="Palier réellement appliqué (après expiration)">
          <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label="Répartition des plans">
            <span className="bg-sand h-full" style={{ width: `${(data.repartition.essentiel / totalRepartition) * 100}%` }} />
            <span className="bg-primary h-full" style={{ width: `${(data.repartition.pro / totalRepartition) * 100}%` }} />
            <span className="bg-success h-full" style={{ width: `${(data.repartition.business / totalRepartition) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex justify-between"><span className="text-ink-2">Essentiel (gratuit)</span><span className="text-ink font-semibold" data-numeric>{data.repartition.essentiel}</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Pro (5 000 F)</span><span className="text-ink font-semibold" data-numeric>{data.repartition.pro}</span></li>
            <li className="flex justify-between"><span className="text-ink-2">Business (15 000 F)</span><span className="text-ink font-semibold" data-numeric>{data.repartition.business}</span></li>
          </ul>
          <p className="text-ink-3 mt-3 text-sm">
            Funnel : {data.funnel.avecBien}/{data.totaux.comptes} ont un bien · {data.funnel.avecBail}/{data.totaux.comptes} un bail actif · {data.funnel.payants} ont payé.
          </p>
        </Bloc>
      </div>

      <div>
        <h2 className="font-display text-ink text-xl font-semibold">Alertes à traiter</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CarteAlerte titre="Expire dans 7 jours" elements={data.alertes.expire7j} />
          <CarteAlerte titre="Expirés retombés" elements={data.alertes.expiresRetombes} />
          <CarteAlerte titre="Quota atteint" elements={data.alertes.quotaAtteints} />
          <CarteAlerte titre="Sans bien après 7 j" elements={data.alertes.sansBien7j} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ comptes */

const aideColonnesComptes = createColumnHelper<AdminCompte>();

function exporterCsv(comptes: AdminCompte[]) {
  const entete = "nom;email;plan_effectif;plan_paye;expire_le;baux_actifs;max_baux;biens;total_paye_fcfa;cree_le;statut";
  const lignes = comptes.map((c) =>
    [c.nom, c.email, c.planEffectif, c.planPaye, c.planExpireLe ?? "", String(c.nbBauxActifs), c.maxBaux ?? "illimite", String(c.nbBiens), String(c.totalPaye), c.creeLe, c.statut]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(";"),
  );
  const blob = new Blob([`\uFEFF${entete}\n${lignes.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "comptes.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

function TableComptes({ donnees }: { donnees: AdminCompte[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtrePlan, setFiltrePlan] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [tri, setTri] = useState<SortingState>([{ id: "creeLe", desc: true }]);

  const filtrees = useMemo(
    () =>
      donnees.filter(
        (c) =>
          (filtrePlan === "tous" || c.planEffectif === filtrePlan) &&
          (filtreStatut === "tous" || c.statut === filtreStatut),
      ),
    [donnees, filtrePlan, filtreStatut],
  );

  const colonnes = useMemo(
    () => [
      aideColonnesComptes.accessor("nom", {
        header: "Compte",
        cell: (info) => (
          <Link
            href={`/admin/comptes/${info.row.original.id}`}
            className="no-underline hover:underline"
            title="Ouvrir la fiche compte"
          >
            <span className="text-ink block font-medium">{info.getValue()}</span>
            <span className="text-ink-3 block text-xs">{info.row.original.email}</span>
          </Link>
        ),
      }),
      aideColonnesComptes.accessor("planEffectif", {
        header: "Plan",
        cell: (info) => <Badge ton={tonPlan(info.getValue())}>{info.getValue()}</Badge>,
      }),
      aideColonnesComptes.accessor("nbBauxActifs", {
        header: "Baux",
        cell: (info) => (
          <span className="text-ink text-sm" data-numeric>
            {info.getValue()}/{info.row.original.maxBaux ?? "∞"}
          </span>
        ),
      }),
      aideColonnesComptes.accessor("nbBiens", { header: "Biens" }),
      aideColonnesComptes.accessor("totalPaye", {
        header: "Payé",
        cell: (info) => <span data-numeric>{formaterMontant(info.getValue())}</span>,
      }),
      aideColonnesComptes.accessor("planExpireLe", {
        header: "Expire le",
        cell: (info) => <span className="text-sm">{formaterDate(info.getValue())}</span>,
      }),
      aideColonnesComptes.accessor("creeLe", {
        header: "Créé le",
        cell: (info) => <span className="text-sm">{formaterDate(info.getValue())}</span>,
      }),
      aideColonnesComptes.accessor("statut", {
        header: "Statut",
        cell: (info) => <Badge ton={tonStatutCompte(info.getValue())}>{libelleStatutCompte[info.getValue()]}</Badge>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtrees,
    columns: colonnes,
    state: { sorting: tri, globalFilter: recherche },
    onSortingChange: setTri,
    onGlobalFilterChange: setRecherche,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher nom ou e-mail…"
          className="border-line bg-surface text-ink min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
          aria-label="Rechercher un compte"
        />
        <select
          value={filtrePlan}
          onChange={(e) => setFiltrePlan(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par plan"
        >
          <option value="tous">Tous plans</option>
          <option value="essentiel">Essentiel</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous statuts</option>
          <option value="payant">Payant</option>
          <option value="expire_bientot">Expire bientôt</option>
          <option value="expire">Expiré</option>
          <option value="quota_atteint">Quota atteint</option>
          <option value="essentiel">Essentiel</option>
        </select>
        <button
          type="button"
          onClick={() => exporterCsv(filtrees)}
          className="border-line text-ink-2 hover:bg-highlight rounded-md border px-3 py-2 text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="border-line mt-3 overflow-x-auto rounded-md border">
        <table className="text-ink-2 w-full min-w-3xl text-left text-sm">
          <thead className="bg-highlight text-ink-3 text-xs uppercase">
            {table.getHeaderGroups().map((groupe) => (
              <tr key={groupe.id}>
                {groupe.headers.map((entete) => (
                  <th key={entete.id} className="px-4 py-2.5 font-semibold">
                    {entete.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={entete.column.getToggleSortingHandler()}
                        className="font-semibold uppercase"
                        title="Trier"
                      >
                        {flexRender(entete.column.columnDef.header, entete.getContext())}
                        {entete.column.getIsSorted() === "asc" ? " ↑" : entete.column.getIsSorted() === "desc" ? " ↓" : ""}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((ligne) => (
              <tr key={ligne.id} className="border-line border-t">
                {ligne.getVisibleCells().map((cellule) => (
                  <td key={cellule.id} className="px-4 py-2.5">
                    {flexRender(cellule.column.columnDef.cell, cellule.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={colonnes.length} className="text-ink-3 px-4 py-6 text-center">
                  Aucun compte ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-ink-3 mt-3 flex items-center justify-between text-sm">
        <span data-numeric>
          Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getFilteredRowModel().rows.length} compte{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-line rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-line rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

function OngletComptes() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "comptes"],
    queryFn: () => lireJson<AdminCompte[]>("/api/admin/comptes"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des comptes…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Comptes indisponibles.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  return <TableComptes donnees={data} />;
}

/* -------------------------------------------------------------- abonnements */

const aideColonnesAbos = createColumnHelper<AdminAbonnement>();

function TableAbonnements({ donnees }: { donnees: AdminAbonnement[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [tri, setTri] = useState<SortingState>([{ id: "creeLe", desc: true }]);

  const filtrees = useMemo(
    () => donnees.filter((a) => filtreStatut === "tous" || a.statut === filtreStatut),
    [donnees, filtreStatut],
  );

  const colonnes = useMemo(
    () => [
      aideColonnesAbos.accessor("creeLe", {
        header: "Payé le",
        cell: (info) => <span className="text-sm">{formaterDate(info.getValue())}</span>,
      }),
      aideColonnesAbos.accessor("proprietaireNom", {
        header: "Propriétaire",
        cell: (info) => (
          <span>
            <span className="text-ink block font-medium">{info.getValue()}</span>
            <span className="text-ink-3 block text-xs">{info.row.original.proprietaireEmail}</span>
          </span>
        ),
      }),
      aideColonnesAbos.accessor("planSlug", {
        header: "Plan",
        cell: (info) => <Badge ton={tonPlan(info.getValue())}>{info.row.original.planNom}</Badge>,
      }),
      aideColonnesAbos.accessor("montantFcfa", {
        header: "Montant",
        cell: (info) => (
          <span className="text-ink font-medium" data-numeric>
            {formaterMontant(info.getValue())}
          </span>
        ),
      }),
      aideColonnesAbos.accessor("periodeFin", {
        header: "Fin de période",
        cell: (info) => {
          const jours = info.row.original.joursRestants;
          return (
            <span className="text-sm">
              {formaterDate(info.getValue())}{" "}
              <span className="text-ink-3" data-numeric>
                ({jours <= 0 ? "expiré" : `J-${jours}`})
              </span>
            </span>
          );
        },
      }),
      aideColonnesAbos.accessor("statut", {
        header: "Statut",
        cell: (info) => <Badge ton={tonStatutAbo(info.getValue())}>{libelleStatutAbo[info.getValue()]}</Badge>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtrees,
    columns: colonnes,
    state: { sorting: tri, globalFilter: recherche },
    onSortingChange: setTri,
    onGlobalFilterChange: setRecherche,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un propriétaire…"
          className="border-line bg-surface text-ink min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
          aria-label="Rechercher un abonnement"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="expire_bientot">Expire bientôt</option>
          <option value="expire">Expiré</option>
        </select>
      </div>

      <div className="border-line mt-3 overflow-x-auto rounded-md border">
        <table className="text-ink-2 w-full min-w-3xl text-left text-sm">
          <thead className="bg-highlight text-ink-3 text-xs uppercase">
            {table.getHeaderGroups().map((groupe) => (
              <tr key={groupe.id}>
                {groupe.headers.map((entete) => (
                  <th key={entete.id} className="px-4 py-2.5 font-semibold">
                    {entete.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={entete.column.getToggleSortingHandler()}
                        className="font-semibold uppercase"
                        title="Trier"
                      >
                        {flexRender(entete.column.columnDef.header, entete.getContext())}
                        {entete.column.getIsSorted() === "asc" ? " ↑" : entete.column.getIsSorted() === "desc" ? " ↓" : ""}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((ligne) => (
              <tr key={ligne.id} className="border-line border-t">
                {ligne.getVisibleCells().map((cellule) => (
                  <td key={cellule.id} className="px-4 py-2.5">
                    {flexRender(cellule.column.columnDef.cell, cellule.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={colonnes.length} className="text-ink-3 px-4 py-6 text-center">
                  Aucun abonnement ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-ink-3 mt-3 flex items-center justify-between text-sm">
        <span data-numeric>
          Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getFilteredRowModel().rows.length} abonnement{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-line rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-line rounded-md border px-3 py-1.5 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}

function OngletAbonnements() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "abonnements"],
    queryFn: () => lireJson<AdminAbonnement[]>("/api/admin/abonnements"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des abonnements…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Abonnements indisponibles.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const total = data.reduce((s, a) => s + a.montantFcfa, 0);
  return (
    <div>
      <p className="text-ink-3 mb-3 text-sm">
        <span className="text-ink font-semibold" data-numeric>{data.length} paiements</span> ·{" "}
        <span className="text-ink font-semibold" data-numeric>{formaterMontant(total)}</span> encaissés au total
      </p>
      <TableAbonnements donnees={data} />
    </div>
  );
}

/* ------------------------------------------------------------------- coquille */

type Onglet = "overview" | "comptes" | "abonnements";

const onglets: { id: Onglet; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "comptes", label: "Comptes" },
  { id: "abonnements", label: "Abonnements" },
];

function Contenu() {
  const [onglet, setOnglet] = useState<Onglet>("overview");
  const client = useQueryClient();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-ink-3 text-xs font-semibold tracking-wider uppercase">Administration</p>
          <h1 className="font-display text-ink mt-1 text-3xl font-semibold">Pilotage du SaaS</h1>
          <p className="text-ink-2 mt-2">Comptes créés, abonnements pris, alertes à traiter.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => client.invalidateQueries({ queryKey: ["admin"] })}
            className="border-line text-ink-2 hover:bg-highlight rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          >
            Actualiser
          </button>
          <Link
            href="/dashboard"
            className="border-line text-ink-2 hover:bg-highlight rounded-md border px-3 py-2 text-sm font-medium no-underline transition-colors"
          >
            ← Retour
          </Link>
        </div>
      </div>

      <div className="border-line mt-6 flex gap-1 border-b" role="tablist" aria-label="Sections admin">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            onClick={() => setOnglet(o.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              onglet === o.id
                ? "border-primary text-ink"
                : "text-ink-3 hover:text-ink border-transparent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {onglet === "overview" && <VueEnsemble />}
        {onglet === "comptes" && <OngletComptes />}
        {onglet === "abonnements" && <OngletAbonnements />}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <Contenu />
    </QueryClientProvider>
  );
}
