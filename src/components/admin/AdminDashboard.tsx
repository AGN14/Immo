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
import { useOngletCourant } from "@/components/admin/AdminShell";
import {
  Badge,
  formaterDate,
  formaterMontant,
  libelleStatutAbo,
  libelleStatutCompte,
  tonPlan,
  tonStatutAbo,
  tonStatutCompte,
  type TonBadge,
} from "@/components/admin/ui";
import type {
  AdminAbonnement,
  AdminAudience,
  AdminCompte,
  AdminEvenement,
  AdminOverview,
  AdminParc,
  AdminReversements,
  AdminSignalementListe,
  AdminSysteme,
  AdminTransaction,
  AdminTransactionsReponse,
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
          (filtreStatut === "tous" ||
            c.statut === filtreStatut ||
            (filtreStatut === "suspendu" && c.suspendu)),
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
        cell: (info) => (
          <span className="flex flex-wrap gap-1">
            <Badge ton={tonStatutCompte(info.getValue())}>{libelleStatutCompte[info.getValue()]}</Badge>
            {info.row.original.suspendu && <Badge ton="danger">Suspendu</Badge>}
          </span>
        ),
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
          <option value="suspendu">Suspendu</option>
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

/* ------------------------------------------------------------- transactions */

const libelleStatutTransaction: Record<string, string> = {
  completed: "Encaissé",
  pending: "En attente",
  processing: "En cours",
  failed: "Échoué",
  expired: "Expiré",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

const tonStatutTransaction = (s: string): TonBadge =>
  s === "completed"
    ? "success"
    : s === "failed"
      ? "danger"
      : s === "processing"
        ? "ambre"
        : "neutre";

const aideColonnesTransactions = createColumnHelper<AdminTransaction>();

function TableTransactions({ donnees }: { donnees: AdminTransaction[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [tri, setTri] = useState<SortingState>([{ id: "creeLe", desc: true }]);

  const filtrees = useMemo(
    () => donnees.filter((t) => filtreStatut === "tous" || t.statut === filtreStatut),
    [donnees, filtreStatut],
  );

  const colonnes = useMemo(
    () => [
      aideColonnesTransactions.accessor("creeLe", {
        header: "Date",
        cell: (info) => <span className="text-sm">{formaterDate(info.getValue())}</span>,
      }),
      aideColonnesTransactions.accessor("reference", {
        header: "Référence",
        cell: (info) => <span className="text-ink font-mono text-xs">{info.getValue()}</span>,
      }),
      aideColonnesTransactions.accessor("montantFcfa", {
        header: "Montant",
        cell: (info) => (
          <span className="text-ink font-medium" data-numeric>
            {formaterMontant(info.getValue())}
          </span>
        ),
      }),
      aideColonnesTransactions.accessor("methode", {
        header: "Moyen",
        cell: (info) => <span className="text-sm">{info.getValue() ?? "—"}</span>,
      }),
      aideColonnesTransactions.accessor("statut", {
        header: "Statut",
        cell: (info) => (
          <Badge ton={tonStatutTransaction(info.getValue())}>
            {libelleStatutTransaction[info.getValue()] ?? info.getValue()}
          </Badge>
        ),
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
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une référence…"
          className="border-line bg-surface text-ink min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
          aria-label="Rechercher une transaction"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous statuts</option>
          <option value="completed">Encaissé</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="failed">Échoué</option>
          <option value="expired">Expiré</option>
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
                  Aucune transaction ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-ink-3 mt-3 flex items-center justify-between text-sm">
        <span data-numeric>
          Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getFilteredRowModel().rows.length} transaction
          {table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
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

function OngletTransactions() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => lireJson<AdminTransactionsReponse>("/api/admin/transactions"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des transactions…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Transactions indisponibles.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const encaisse = data.transactions
    .filter((t) => t.statut === "completed")
    .reduce((s, t) => s + t.montantFcfa, 0);

  return (
    <div>
      <div className="border-line bg-surface mb-3 rounded-md border p-4">
        <p className="text-sm">
          <span className="text-ink font-semibold">GeniusPay : {data.diagnostic}</span>
          {data.bacASable && <span className="text-ink-3"> — bac à sable, aucun argent réel.</span>}
        </p>
        <p className="text-ink-3 mt-1 text-sm">
          <span className="text-ink font-semibold" data-numeric>{formaterMontant(encaisse)}</span>{" "}
          encaissés sur les {data.transactions.length} dernières transactions — loyers et
          abonnements confondus, à réconcilier avec vos versements et abonnements.
        </p>
        <p className="text-ink-3 mt-1 text-sm">
          Remboursement : GeniusPay n&apos;expose pas d&apos;endpoint — il se fait depuis
          le tableau de bord marchand, transaction par transaction.
        </p>
      </div>
      <TableTransactions donnees={data.transactions} />
    </div>
  );
}

/* --------------------------------------------------------------- moderation */

const libelleStatutSignalement: Record<string, string> = {
  signale: "Signalé",
  "pris-en-charge": "Pris en charge",
  resolu: "Résolu",
  confirme: "Confirmé",
  annule: "Annulé",
};

const tonStatutSignalement = (s: string): TonBadge =>
  s === "signale" ? "danger" : s === "pris-en-charge" ? "ambre" : "neutre";

const aideColonnesSignalements = createColumnHelper<AdminSignalementListe>();

function TableSignalements({ donnees }: { donnees: AdminSignalementListe[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreUrgence, setFiltreUrgence] = useState("tous");
  const [tri, setTri] = useState<SortingState>([{ id: "creeLe", desc: true }]);

  const filtrees = useMemo(
    () =>
      donnees.filter(
        (s) =>
          (filtreStatut === "tous" || s.statut === filtreStatut) &&
          (filtreUrgence === "tous" || s.urgence === filtreUrgence),
      ),
    [donnees, filtreStatut, filtreUrgence],
  );

  const colonnes = useMemo(
    () => [
      aideColonnesSignalements.accessor("titre", {
        header: "Dossier",
        cell: (info) => (
          <Link
            href={`/admin/signalements/${info.row.original.id}`}
            className="no-underline hover:underline"
            title="Ouvrir le dossier"
          >
            <span className="text-ink block font-medium">{info.getValue()}</span>
            <span className="text-ink-3 block text-xs">{info.row.original.ville}</span>
          </Link>
        ),
      }),
      aideColonnesSignalements.accessor("urgence", {
        header: "Urgence",
        cell: (info) => (
          <Badge ton={info.getValue() === "haute" ? "danger" : info.getValue() === "normale" ? "ambre" : "neutre"}>
            {info.getValue()}
          </Badge>
        ),
      }),
      aideColonnesSignalements.accessor("statut", {
        header: "Statut",
        cell: (info) => (
          <Badge ton={tonStatutSignalement(info.getValue())}>
            {libelleStatutSignalement[info.getValue()] ?? info.getValue()}
          </Badge>
        ),
      }),
      aideColonnesSignalements.accessor("creeLe", {
        header: "Signalé le",
        cell: (info) => <span className="text-sm">{formaterDate(info.getValue())}</span>,
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
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un titre, une ville…"
          className="border-line bg-surface text-ink min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
          aria-label="Rechercher un signalement"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par statut"
        >
          <option value="tous">Tous statuts</option>
          <option value="signale">Signalé</option>
          <option value="pris-en-charge">Pris en charge</option>
          <option value="resolu">Résolu</option>
          <option value="confirme">Confirmé</option>
          <option value="annule">Annulé</option>
        </select>
        <select
          value={filtreUrgence}
          onChange={(e) => setFiltreUrgence(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par urgence"
        >
          <option value="tous">Toutes urgences</option>
          <option value="haute">Haute</option>
          <option value="normale">Normale</option>
          <option value="basse">Basse</option>
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
                  Aucun dossier ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-ink-3 mt-3 flex items-center justify-between text-sm">
        <span data-numeric>
          Page {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getFilteredRowModel().rows.length} dossier
          {table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
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

function OngletModeration() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "signalements"],
    queryFn: () => lireJson<AdminSignalementListe[]>("/api/admin/signalements"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des dossiers…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Dossiers indisponibles.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const ouverts = data.filter((s) => s.statut === "signale" || s.statut === "pris-en-charge").length;
  return (
    <div>
      <p className="text-ink-3 mb-3 text-sm">
        <span className="text-ink font-semibold" data-numeric>{ouverts} dossier{ouverts > 1 ? "s" : ""} ouvert{ouverts > 1 ? "s" : ""}</span> sur{" "}
        <span className="text-ink font-semibold" data-numeric>{data.length}</span> au total.
        Ouvrez un dossier pour voir photos, échanges et parties, puis tranchez.
      </p>
      <TableSignalements donnees={data} />
    </div>
  );
}

/* ------------------------------------------------------------------- journal */

const libelleActionAdmin: Record<AdminEvenement["action"], string> = {
  plan_change: "Changement de plan",
  prolongation: "Prolongation",
  moderation_statut: "Modération (statut)",
  moderation_urgence: "Modération (urgence)",
  suspension: "Suspension",
  reintegration: "Réintégration",
};

function OngletJournal() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "journal"],
    queryFn: () => lireJson<AdminEvenement[]>("/api/admin/journal"),
  });
  const [filtre, setFiltre] = useState("tous");

  const filtrees = useMemo(
    () => (data ?? []).filter((e) => filtre === "tous" || e.action === filtre),
    [data, filtre],
  );

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement du journal…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Journal indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="text-ink-3 text-sm" data-numeric>
          {filtrees.length} geste{filtrees.length > 1 ? "s" : ""} tracé{filtrees.length > 1 ? "s" : ""}
        </p>
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
          aria-label="Filtrer par action"
        >
          <option value="tous">Toutes actions</option>
          <option value="plan_change">Changement de plan</option>
          <option value="prolongation">Prolongation</option>
        </select>
      </div>
      {filtrees.length === 0 ? (
        <p className="text-ink-3 py-10 text-center text-sm">
          Aucun geste manuel pour l&apos;instant — ils apparaîtront ici dès la première
          prolongation ou changement de plan.
        </p>
      ) : (
        <div className="border-line mt-3 overflow-x-auto rounded-md border">
          <table className="text-ink-2 w-full min-w-3xl text-left text-sm">
            <thead className="bg-highlight text-ink-3 text-xs uppercase">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Acteur</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
                <th className="px-4 py-2.5 font-semibold">Compte</th>
                <th className="px-4 py-2.5 font-semibold">Détail</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map((e) => (
                <tr key={e.id} className="border-line border-t">
                  <td className="px-4 py-2.5 text-sm">{formaterDate(e.creeLe)}</td>
                  <td className="px-4 py-2.5 text-sm">{e.acteurEmail}</td>
                  <td className="px-4 py-2.5">
                    <Badge ton={e.action === "plan_change" ? "primary" : "ambre"}>
                      {libelleActionAdmin[e.action]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-sm">{e.proprietaireEmail}</td>
                  <td className="px-4 py-2.5 text-sm">{e.resume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- parc */

function OngletParc() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "parc"],
    queryFn: () => lireJson<AdminParc>("/api/admin/parc"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement du parc…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Parc indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const maxVille = Math.max(...data.villes.map((v) => v.nbBiens), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Biens suivis"
          value={String(data.biens)}
          caption={`${data.lots} lots au total`}
          icon={<span aria-hidden="true">◆</span>}
        />
        <KPICard
          label="Occupation"
          value={`${data.tauxOccupation}%`}
          caption={`${data.bauxActifs} baux actifs`}
          icon={<span aria-hidden="true">▲</span>}
        />
        <KPICard
          label="En attente"
          value={formaterMontant(data.totalEnAttenteFcfa)}
          caption={`${data.enAttente.length} déclaration${data.enAttente.length > 1 ? "s" : ""} à confirmer`}
          icon={<span aria-hidden="true">●</span>}
        />
        <KPICard
          label="Signalements ouverts"
          value={String(data.signalementsOuverts)}
          caption={Object.entries(data.signalementsParUrgence).map(([u, n]) => `${n} ${u}`).join(" · ") || "Aucun"}
          icon={<span aria-hidden="true">★</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Villes</h2>
          <p className="text-ink-3 mt-1 text-sm">Biens par ville, top 10.</p>
          <ul className="mt-4 space-y-2.5">
            {data.villes.map((v) => (
              <li key={v.ville}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink-2">{v.ville}</span>
                  <span className="text-ink font-semibold" data-numeric>{v.nbBiens}</span>
                </div>
                <div className="bg-sand mt-1 h-2 overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(v.nbBiens / maxVille) * 100}%` }} />
                </div>
              </li>
            ))}
            {data.villes.length === 0 && (
              <li className="text-ink-3 text-sm">Aucun bien pour l&apos;instant.</li>
            )}
          </ul>
        </section>

        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Signalements récents</h2>
          <p className="text-ink-3 mt-1 text-sm">Ouverts, tous parcs confondus.</p>
          {data.signalementsRecents.length === 0 ? (
            <p className="text-ink-3 mt-4 text-sm">Aucun signalement ouvert.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {data.signalementsRecents.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/admin/signalements/${s.id}`}
                    className="text-ink min-w-0 flex-1 truncate font-medium no-underline hover:underline"
                    title="Ouvrir le dossier"
                  >
                    {s.titre}
                  </Link>
                  <span className="text-ink-3 text-xs">{s.ville} · {formaterDate(s.creeLe)}</span>
                  <Badge ton={s.urgence === "haute" ? "danger" : s.urgence === "normale" ? "ambre" : "neutre"}>
                    {s.urgence}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Déclarations en attente</h2>
        <p className="text-ink-3 mt-1 text-sm">
          Loyers déclarés que les propriétaires n&apos;ont pas encore confirmés — les plus anciens
          d&apos;abord. Le badge distingue le paiement en ligne d&apos;une déclaration manuelle.
        </p>
        {data.enAttente.length === 0 ? (
          <p className="text-ink-3 mt-4 text-sm">Rien en attente.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="text-ink-2 w-full min-w-xl text-left text-sm">
              <thead className="text-ink-3 text-xs uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Depuis le</th>
                  <th className="py-2 pr-4 font-semibold">Propriétaire</th>
                  <th className="py-2 pr-4 font-semibold">Montant</th>
                  <th className="py-2 font-semibold">Canal</th>
                </tr>
              </thead>
              <tbody>
                {data.enAttente.map((v) => (
                  <tr key={v.id} className="border-line border-t">
                    <td className="py-2 pr-4">{formaterDate(v.depuisLe)}</td>
                    <td className="py-2 pr-4">{v.proprietaireEmail}</td>
                    <td className="py-2 pr-4 font-medium" data-numeric>{formaterMontant(v.montantFcfa)}</td>
                    <td className="py-2">
                      <Badge ton={v.enLigne ? "primary" : "neutre"}>
                        {v.enLigne ? "En ligne" : "Manuel"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------- systeme */

function LigneSysteme({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
      <span className="text-ink-3 text-sm">{label}</span>
      <span className="text-ink text-sm font-medium">{children}</span>
    </div>
  );
}

function OngletSysteme() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "systeme"],
    queryFn: () => lireJson<AdminSysteme>("/api/admin/systeme"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement de l&apos;état…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">État indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Base de données</h2>
        <div className="mt-2 divide-y divide-line-soft">
          <LigneSysteme label="Latence (aller-retour)">
            {data.supabaseLatenceMs === null ? (
              <Badge ton="danger">Injoignable</Badge>
            ) : (
              <span data-numeric>{data.supabaseLatenceMs} ms</span>
            )}
          </LigneSysteme>
          <LigneSysteme label="Comptes">
            <span data-numeric>{data.comptes}</span>
          </LigneSysteme>
          <LigneSysteme label="Abonnements">
            <span data-numeric>{data.abonnements}</span>
          </LigneSysteme>
        </div>
      </section>

      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Paiements GeniusPay</h2>
        <div className="mt-2 divide-y divide-line-soft">
          <LigneSysteme label="Clés">
            <span className="text-sm">{data.geniuspayDiagnostic}</span>
          </LigneSysteme>
          <LigneSysteme label="Monde">
            <Badge ton={data.geniuspayBacASable ? "ambre" : "success"}>
              {data.geniuspayBacASable ? "Bac à sable" : "Production"}
            </Badge>
          </LigneSysteme>
        </div>
      </section>

      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Déploiement</h2>
        <div className="mt-2 divide-y divide-line-soft">
          <LigneSysteme label="Version">
            <span className="font-mono text-xs" data-numeric>{data.deploiement.commit}</span>
          </LigneSysteme>
          <LigneSysteme label="Environnement">
            <span data-numeric>{data.deploiement.environnement}</span>
          </LigneSysteme>
          <LigneSysteme label="Hôte admin">
            <Badge ton={data.deploiement.hoteAdmin === "configuré" ? "success" : "danger"}>
              {data.deploiement.hoteAdmin}
            </Badge>
          </LigneSysteme>
        </div>
      </section>

      <section className="border-line bg-surface rounded-md border p-5 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-ink text-xl font-semibold">Référentiel plans</h2>
          {data.plansOk ? (
            <Badge ton="success">Code et base alignés</Badge>
          ) : (
            <Badge ton="danger">{data.plansEcarts.length} écart{data.plansEcarts.length > 1 ? "s" : ""}</Badge>
          )}
        </div>
        <p className="text-ink-3 mt-1 text-sm">
          Prix et quotas facturés par le code face à la table `plan` lue par l&apos;affichage —
          tout écart est un bug en attente.
        </p>
        {!data.plansOk && (
          <ul className="mt-3 space-y-1.5">
            {data.plansEcarts.map((e, i) => (
              <li key={`${e.slug}-${e.champ}-${i}`} className="text-sm">
                <span className="text-ink font-medium">{e.slug} · {e.champ}</span>{" "}
                <span className="text-ink-3">base : {e.base} — code : {e.code}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ audience */

function BarresAudience({
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
    <div className="flex h-32 items-end gap-1" role="img" aria-label="14 derniers jours">
      {valeurs.map((v, i) => (
        <div key={etiquettes[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${etiquettes[i]} : ${formater(v)}`}>
          <div className="flex h-24 w-full items-end">
            <div
              className="bg-primary w-full rounded-t-sm"
              style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-ink-3 text-[9px]">{etiquettes[i]}</span>
        </div>
      ))}
    </div>
  );
}

function OngletAudience() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "audience"],
    queryFn: () => lireJson<AdminAudience>("/api/admin/audience"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement de l&apos;audience…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Audience indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const inscrits14j = data.serie.reduce((s, j) => s + j.inscriptions, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Visiteurs (14 j)"
          value={String(data.visiteursUniques14j)}
          caption={`${data.pagesVues14j} pages vues, mesure consentie`}
          icon={<span aria-hidden="true">◆</span>}
          tendance={data.serie.map((j) => j.visiteurs)}
        />
        <KPICard
          label="Temps moyen"
          value={data.tempsMoyenSecondes === null ? "—" : `${data.tempsMoyenSecondes} s`}
          caption="Par page vue"
          icon={<span aria-hidden="true">●</span>}
        />
        <KPICard
          label="Inscriptions (14 j)"
          value={String(inscrits14j)}
          caption="Comptes créés, tous appareils"
          icon={<span aria-hidden="true">▲</span>}
          tendance={data.serie.map((j) => j.inscriptions)}
        />
        <KPICard
          label="Newsletter"
          value={String(data.newsletterActifs)}
          caption={`${data.newsletterTotal} adresses au total`}
          icon={<span aria-hidden="true">★</span>}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Visiteurs</h2>
          <p className="text-ink-3 mt-1 text-sm">Uniques par jour, 14 derniers jours.</p>
          <div className="mt-3">
            <BarresAudience
              valeurs={data.serie.map((j) => j.visiteurs)}
              etiquettes={data.serie.map((j) => j.label)}
              formater={(n) => `${n} visiteur${n > 1 ? "s" : ""}`}
            />
          </div>
        </section>
        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Pages vues</h2>
          <p className="text-ink-3 mt-1 text-sm">Où s&apos;arrêtent les visiteurs.</p>
          <ul className="mt-3 space-y-1.5">
            {data.pagesTop.map((p) => (
              <li key={p.chemin} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-ink-2 min-w-0 flex-1 truncate font-mono text-xs">{p.chemin}</span>
                <span className="text-ink font-semibold" data-numeric>{p.nb}</span>
              </li>
            ))}
            {data.pagesTop.length === 0 && (
              <li className="text-ink-3 text-sm">Pas encore de mesure — elle démarre aux prochains consentements.</li>
            )}
          </ul>
          {data.clicsTop.length > 0 && (
            <>
              <h3 className="text-ink mt-4 text-sm font-semibold">Clics marqués</h3>
              <ul className="mt-2 space-y-1.5">
                {data.clicsTop.map((c) => (
                  <li key={c.label} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-ink-2 min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="text-ink font-semibold" data-numeric>{c.nb}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Relances à faire</h2>
          <p className="text-ink-3 mt-1 text-sm">
            Paliers payants expirant sous 7 jours ou échus depuis moins de 30 — sans
            reconduction auto ni e-mail auto, cette liste EST la relance.
          </p>
          {data.relances.length === 0 ? (
            <p className="text-ink-3 mt-3 text-sm">Rien à relancer.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.relances.map((r) => (
                <li key={r.id} className="text-sm">
                  <Link href={`/admin/comptes/${r.id}`} className="text-ink font-medium no-underline hover:underline">
                    {r.nom}
                  </Link>{" "}
                  <span className="text-ink-3 text-xs">{r.email}</span>
                  <span className="block text-xs">
                    <Badge ton={r.joursRestants < 0 ? "danger" : r.joursRestants <= 3 ? "ambre" : "neutre"}>
                      {r.plan} · {r.joursRestants < 0 ? `expiré depuis ${-r.joursRestants} j` : `J-${r.joursRestants}`}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Newsletter</h2>
        <p className="text-ink-3 mt-1 text-sm">Dernières adresses collectées.</p>
        {data.newsletterRecents.length === 0 ? (
          <p className="text-ink-3 mt-3 text-sm">Aucune adresse pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.newsletterRecents.map((n) => (
              <li key={n.email} className="flex items-baseline justify-between gap-2 border-b border-line-soft py-1.5 text-sm">
                <span className="text-ink-2 min-w-0 flex-1 truncate">{n.email}</span>
                <span className="text-ink-3 shrink-0 text-xs">{formaterDate(n.creeLe)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- reversements */

const libelleStatutReversement: Record<string, string> = {
  prevu: "Prévu",
  envoye: "Envoyé",
  echoue: "Échoué",
};

function OngletReversements() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "reversements"],
    queryFn: () => lireJson<AdminReversements>("/api/admin/reversements"),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement des reversements…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Reversements indisponibles.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          label="Reversé (net)"
          value={formaterMontant(data.totalNetFcfa)}
          caption="Tous propriétaires confondus"
          icon={<span aria-hidden="true">◆</span>}
        />
        <KPICard
          label="En retard"
          value={String(data.enRetard)}
          caption="Prévus dont la date est passée"
          icon={<span aria-hidden="true">●</span>}
          hausseSouhaitee={false}
        />
        <KPICard
          label="Échoués"
          value={String(data.echoues)}
          caption="À retraiter côté opérateur"
          icon={<span aria-hidden="true">▲</span>}
          hausseSouhaitee={false}
        />
      </div>

      {data.reversements.length === 0 ? (
        <p className="text-ink-3 py-10 text-center text-sm">Aucun reversement enregistré.</p>
      ) : (
        <div className="border-line mt-4 overflow-x-auto rounded-md border">
          <table className="text-ink-2 w-full min-w-3xl text-left text-sm">
            <thead className="bg-highlight text-ink-3 text-xs uppercase">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Période</th>
                <th className="px-4 py-2.5 font-semibold">Propriétaire</th>
                <th className="px-4 py-2.5 font-semibold">Net</th>
                <th className="px-4 py-2.5 font-semibold">Prévu le</th>
                <th className="px-4 py-2.5 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.reversements.map((r) => (
                <tr key={r.id} className="border-line border-t">
                  <td className="px-4 py-2.5" data-numeric>{r.periode}</td>
                  <td className="px-4 py-2.5 text-sm">{r.proprietaireEmail}</td>
                  <td className="px-4 py-2.5" data-numeric>
                    <span className="text-ink font-medium">{formaterMontant(r.netFcfa)}</span>{" "}
                    <span className="text-ink-3 text-xs">(brut {formaterMontant(r.brutFcfa)})</span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    {formaterDate(r.prevuLe)}
                    {r.executeLe && <span className="text-ink-3"> · fait le {formaterDate(r.executeLe)}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge ton={r.enRetard || r.statut === "echoue" ? "danger" : r.statut === "envoye" ? "success" : "neutre"}>
                      {r.enRetard ? "En retard" : (libelleStatutReversement[r.statut] ?? r.statut)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- coquille */

export type OngletAdmin =
  | "overview"
  | "comptes"
  | "abonnements"
  | "transactions"
  | "moderation"
  | "parc"
  | "audience"
  | "reversements"
  | "journal"
  | "systeme";

function Contenu() {
  // L'onglet vit dans l'URL et se pilote depuis la barre latérale, seule
  // navigation : pas de doublon interne. Ici, contenu de la section +
  // actualisation, rien de plus.
  const onglet = useOngletCourant();
  const client = useQueryClient();

  return (
    <div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => client.invalidateQueries({ queryKey: ["admin"] })}
          className="border-line text-ink-2 hover:bg-highlight rounded-md border px-3 py-2 text-sm font-medium transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="mt-6">
        {onglet === "overview" && <VueEnsemble />}
        {onglet === "comptes" && <OngletComptes />}
        {onglet === "abonnements" && <OngletAbonnements />}
        {onglet === "transactions" && <OngletTransactions />}
        {onglet === "moderation" && <OngletModeration />}
        {onglet === "parc" && <OngletParc />}
        {onglet === "audience" && <OngletAudience />}
        {onglet === "reversements" && <OngletReversements />}
        {onglet === "journal" && <OngletJournal />}
        {onglet === "systeme" && <OngletSysteme />}
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
