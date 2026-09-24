/**
 * Fiche d'un compte : parc, abonnements et gestes manuels.
 *
 * Les mutations passent par TanStack Query (`useMutation`) vers les routes
 * /api/admin/comptes/[id]/* et invalident tout le cache `["admin"]` en cas
 * de succès — la liste des comptes et la vue d'ensemble suivent aussitôt.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
import type { AdminCompteDetail, DetailBien } from "@/lib/admin/types";
import type { PlanId } from "@/lib/plans";

async function poster(url: string, corps: unknown): Promise<{ expireLe?: string | null }> {
  const reponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  const json = (await reponse.json()) as { erreur?: string; expireLe?: string | null };
  if (!reponse.ok) throw new Error(json.erreur ?? "Action impossible.");
  return json;
}

function BlocPlan({
  compteId,
  planPaye,
  planEffectif,
}: {
  compteId: string;
  planPaye: PlanId;
  planEffectif: PlanId;
}) {
  const client = useQueryClient();
  const [planChoisi, setPlanChoisi] = useState<PlanId>(planPaye);
  const [joursPlan, setJoursPlan] = useState(30);
  const [joursProlongation, setJoursProlongation] = useState(30);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  const apresSucces = (texte: string) => {
    setMessage({ ok: true, texte });
    client.invalidateQueries({ queryKey: ["admin"] });
  };
  const apresEchec = (e: unknown) =>
    setMessage({ ok: false, texte: e instanceof Error ? e.message : "Action impossible." });

  const changerPlan = useMutation({
    mutationFn: () => poster(`/api/admin/comptes/${compteId}/plan`, { plan: planChoisi, jours: joursPlan }),
    onSuccess: (r) =>
      apresSucces(
        planChoisi === "essentiel"
          ? "Compte repassé en Essentiel."
          : `Plan ${planChoisi} appliqué jusqu'au ${formaterDate(r.expireLe ?? null)}.`,
      ),
    onError: apresEchec,
  });

  const prolonger = useMutation({
    mutationFn: () => poster(`/api/admin/comptes/${compteId}/prolonger`, { jours: joursProlongation }),
    onSuccess: (r) => apresSucces(`Prolongé jusqu'au ${formaterDate(r.expireLe ?? null)}.`),
    onError: apresEchec,
  });

  const confirmer = (texte: string) => window.confirm(texte);
  const occupe = changerPlan.isPending || prolonger.isPending;

  return (
    <section className="border-line bg-surface rounded-md border p-5">
      <h2 className="font-display text-ink text-xl font-semibold">Plan & abonnement</h2>
      <p className="text-ink-3 mt-1 text-sm">
        Plan payé : <Badge ton={tonPlan(planPaye)}>{planPaye}</Badge> · Plan effectif :{" "}
        <Badge ton={tonPlan(planEffectif)}>{planEffectif}</Badge> — chaque geste est tracé
        dans l&apos;historique (montant 0, badge « geste »).
      </p>

      {message && (
        <p className={`mt-3 rounded-md px-3 py-2 text-sm ${message.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {message.texte}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-line rounded-md border p-4">
          <h3 className="text-ink text-sm font-semibold">Changer de plan</h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <select
              value={planChoisi}
              onChange={(e) => setPlanChoisi(e.target.value as PlanId)}
              className="border-line bg-surface text-ink rounded-md border px-3 py-2 text-sm"
              aria-label="Nouveau plan"
              disabled={occupe}
            >
              <option value="essentiel">Essentiel (gratuit)</option>
              <option value="pro">Pro (5 000 F)</option>
              <option value="business">Business (15 000 F)</option>
            </select>
            {planChoisi !== "essentiel" && (
              <label className="text-ink-2 flex items-center gap-1.5 text-sm">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={joursPlan}
                  onChange={(e) => setJoursPlan(Number(e.target.value))}
                  className="border-line bg-surface text-ink w-20 rounded-md border px-2 py-2 text-sm"
                  aria-label="Durée en jours"
                  disabled={occupe}
                />
                jours
              </label>
            )}
            <button
              type="button"
              disabled={occupe}
              onClick={() => {
                if (confirmer(`Appliquer le plan ${planChoisi} à ce compte ?`)) changerPlan.mutate();
              }}
              className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
        </div>

        <div className="border-line rounded-md border p-4">
          <h3 className="text-ink text-sm font-semibold">Prolonger l&apos;abonnement en cours</h3>
          <p className="text-ink-3 mt-1 text-xs">Part du plus tard entre aujourd&apos;hui et l&apos;échéance actuelle.</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <label className="text-ink-2 flex items-center gap-1.5 text-sm">
              <input
                type="number"
                min={1}
                max={365}
                value={joursProlongation}
                onChange={(e) => setJoursProlongation(Number(e.target.value))}
                className="border-line bg-surface text-ink w-20 rounded-md border px-2 py-2 text-sm"
                aria-label="Jours à ajouter"
                disabled={occupe}
              />
              jours
            </label>
            <button
              type="button"
              disabled={occupe}
              onClick={() => {
                if (confirmer(`Prolonger de ${joursProlongation} jours ?`)) prolonger.mutate();
              }}
              className="border-line text-ink hover:bg-highlight rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Prolonger
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlocParc({ biens }: { biens: DetailBien[] }) {
  if (biens.length === 0) {
    return (
      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Parc</h2>
        <p className="text-ink-3 mt-2 text-sm">Aucun bien — onboarding inachevé, compte à relancer.</p>
      </section>
    );
  }
  return (
    <section className="border-line bg-surface rounded-md border p-5">
      <h2 className="font-display text-ink text-xl font-semibold">Parc</h2>
      <div className="mt-4 space-y-4">
        {biens.map((b) => (
          <div key={b.id} className="border-line rounded-md border p-4">
            <p className="text-ink font-semibold">
              {b.nom} <span className="text-ink-3 font-normal">· {b.ville}</span>
            </p>
            {b.lots.length === 0 ? (
              <p className="text-ink-3 mt-1 text-sm">Aucun lot.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {b.lots.map((l) => (
                  <li key={l.id} className="text-ink-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {l.nom} <span className="text-ink-3">· {l.composition}</span>
                    </span>
                    {l.bail ? (
                      <span className="flex items-center gap-2">
                        <Badge ton={l.bail.statut === "actif" ? "success" : "neutre"}>
                          {l.bail.statut === "actif" ? "Loué" : "Bail terminé"}
                        </Badge>
                        <span data-numeric>{formaterMontant(l.bail.loyerMensuelFcfa)}</span>
                        <span className="text-ink-3">{l.bail.locataireNom}</span>
                      </span>
                    ) : (
                      <Badge ton="neutre">Libre</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Contenu({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "compte", id],
    queryFn: async () => {
      const reponse = await fetch(`/api/admin/comptes/${id}`);
      if (reponse.status === 404) throw new Error("Compte introuvable.");
      if (!reponse.ok) throw new Error("Fiche indisponible.");
      return (await reponse.json()) as AdminCompteDetail;
    },
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement de la fiche…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Fiche indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const { compte: c } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-primary text-sm font-semibold no-underline">
            ← Tous les comptes
          </Link>
          <h1 className="font-display text-ink mt-1 text-3xl font-semibold">{c.nom}</h1>
          <p className="text-ink-2 mt-1 text-sm">
            {c.email} · inscrit le {formaterDate(c.creeLe)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge ton={tonStatutCompte(c.statut)}>{libelleStatutCompte[c.statut]}</Badge>
            <Badge ton={tonPlan(c.planEffectif)}>Plan : {c.planEffectif}</Badge>
            {c.planExpireLe && <Badge ton="neutre">Expire le {formaterDate(c.planExpireLe)}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Baux actifs"
          value={`${c.nbBauxActifs} / ${c.maxBaux ?? "∞"}`}
          caption={c.quota === "atteint" ? "Quota atteint" : c.quota === "proche" ? "Proche du quota" : "Sous le quota"}
          icon={<span aria-hidden="true">◆</span>}
        />
        <KPICard
          label="Biens · Locataires"
          value={`${c.nbBiens} · ${data.nbLocataires}`}
          caption={`${data.signalementsOuverts} signalement${data.signalementsOuverts > 1 ? "s" : ""} ouvert${data.signalementsOuverts > 1 ? "s" : ""}`}
          icon={<span aria-hidden="true">▲</span>}
        />
        <KPICard
          label="Abonnements payés"
          value={formaterMontant(c.totalPaye)}
          caption={`${c.nbAbonnements} paiement${c.nbAbonnements > 1 ? "s" : ""}${c.dernierPaiementLe ? ` · dernier le ${formaterDate(c.dernierPaiementLe)}` : ""}`}
          icon={<span aria-hidden="true">●</span>}
        />
        <KPICard
          label="Loyers confirmés"
          value={formaterMontant(data.gmvConfirmeFcfa)}
          caption="GMV transitant par ce parc"
          icon={<span aria-hidden="true">★</span>}
        />
      </div>

      <BlocPlan compteId={c.id} planPaye={c.planPaye} planEffectif={c.planEffectif} />

      <BlocParc biens={data.biens} />

      <section className="border-line bg-surface rounded-md border p-5">
        <h2 className="font-display text-ink text-xl font-semibold">Historique des abonnements</h2>
        {data.abonnements.length === 0 ? (
          <p className="text-ink-3 mt-2 text-sm">Aucun abonnement — compte 100 % gratuit.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="text-ink-2 w-full min-w-xl text-left text-sm">
              <thead className="text-ink-3 text-xs uppercase">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Payé le</th>
                  <th className="py-2 pr-4 font-semibold">Plan</th>
                  <th className="py-2 pr-4 font-semibold">Montant</th>
                  <th className="py-2 pr-4 font-semibold">Période</th>
                  <th className="py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.abonnements.map((a) => (
                  <tr key={a.id} className="border-line border-t">
                    <td className="py-2 pr-4">{formaterDate(a.creeLe)}</td>
                    <td className="py-2 pr-4">
                      <Badge ton={tonPlan(a.planSlug)}>{a.planNom}</Badge>
                    </td>
                    <td className="py-2 pr-4" data-numeric>
                      {a.gesteAdmin ? <Badge ton="ambre">geste</Badge> : formaterMontant(a.montantFcfa)}
                    </td>
                    <td className="py-2 pr-4 text-sm">
                      {formaterDate(a.periodeDebut)} → {formaterDate(a.periodeFin)}
                    </td>
                    <td className="py-2">
                      <Badge ton={tonStatutAbo(a.statut)}>{libelleStatutAbo[a.statut]}</Badge>
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

export function AdminCompteDetail({ id }: { id: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <Contenu id={id} />
    </QueryClientProvider>
  );
}
