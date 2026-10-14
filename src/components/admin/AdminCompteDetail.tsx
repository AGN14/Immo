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
import type { AdminCompteDetail, AdminDossier, DetailBien } from "@/lib/admin/types";
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
            {c.suspendu && (
              <Badge ton="danger">
                Suspendu{c.suspenduLe ? ` depuis le ${formaterDate(c.suspenduLe)}` : ""}
              </Badge>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <a
            href={`mailto:${c.email}?subject=${encodeURIComponent("Votre compte Xwégán")}`}
            className="border-line text-ink-2 hover:bg-highlight inline-block rounded-md border px-3 py-2 text-sm font-medium no-underline transition-colors"
          >
            Contacter
          </a>
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

      <BlocRestriction compteId={c.id} suspendu={c.suspendu} />

      <BlocParc biens={data.biens} />

      <BlocDossier compteId={c.id} />

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

/**
 * Restriction du compte : suspendu de la session ET de RLS, données intactes.
 * Jamais sur un e-mail d'équipe (refusé côté serveur). Chaque acte est
 * journalisé avec son auteur et son motif.
 */
function BlocRestriction({ compteId, suspendu }: { compteId: string; suspendu: boolean }) {
  const client = useQueryClient();
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (corps: { suspendu: boolean; motif?: string }) =>
      poster(`/api/admin/comptes/${compteId}/suspension`, corps),
    onSuccess: (_, variables) => {
      setMessage({
        ok: true,
        texte: variables.suspendu ? "Compte suspendu — acte journalisé." : "Compte réintégré — acte journalisé.",
      });
      setMotif("");
      client.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: unknown) =>
      setMessage({ ok: false, texte: e instanceof Error ? e.message : "Action impossible." }),
  });

  return (
    <section className="border-danger rounded-md border p-5">
      <h2 className="font-display text-ink text-xl font-semibold">Restriction du compte</h2>
      <p className="text-ink-2 mt-1 text-sm">
        {suspendu
          ? "Compte suspendu : banni de la session et de la base, baux et paiements intacts."
          : "Suspendre bannit le compte de la session et de la base, sans toucher à ses données."}
      </p>

      {message && (
        <p className={`mt-3 rounded-md px-3 py-2 text-sm ${message.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {message.texte}
        </p>
      )}

      {suspendu ? (
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            if (window.confirm("Réintégrer ce compte ? Il retrouvera l'accès aussitôt.")) {
              setMessage(null);
              mutation.mutate({ suspendu: false });
            }
          }}
          className="bg-primary text-on-primary hover:bg-primary-hi mt-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Réintégrer le compte
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif (abus, fraude, impayé SaaS…) — consigné au journal"
            aria-label="Motif de la suspension"
            className="border-line bg-surface text-ink min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
            disabled={mutation.isPending}
          />
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              if (window.confirm("Suspendre ce compte ? Il perdra l'accès aussitôt, données intactes.")) {
                setMessage(null);
                mutation.mutate({ suspendu: true, motif });
              }
            }}
            className="bg-danger text-on-primary hover:brightness-110 rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Suspendre le compte
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * Dossier documentaire : un dossier par bien, un sous-dossier par lot — photo
 * du bien, photos des pannes, avatar du locataire en place. Tout ce que le
 * parc montre comme image, réuni pour modérer d'un seul écran.
 */
function Vignette({ src, legende }: { src: string; legende?: string }) {
  return (
    <figure className="m-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={legende ?? "Photo du dossier"}
        className="border-line aspect-square w-full rounded-md border object-cover"
        loading="lazy"
      />
      {legende && <figcaption className="text-ink-3 mt-1 truncate text-xs">{legende}</figcaption>}
    </figure>
  );
}

function BlocDossier({ compteId }: { compteId: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "dossier", compteId],
    queryFn: async () => {
      const reponse = await fetch(`/api/admin/comptes/${compteId}/documents`);
      if (!reponse.ok) throw new Error("Dossier indisponible.");
      return (await reponse.json()) as AdminDossier;
    },
  });

  return (
    <section className="border-line bg-surface rounded-md border p-5">
      <h2 className="font-display text-ink text-xl font-semibold">Dossier documentaire</h2>
      <p className="text-ink-3 mt-1 text-sm">
        {isPending
          ? "Chargement…"
          : data && data.totalPhotos > 0
            ? `${data.biens.length} bien${data.biens.length > 1 ? "s" : ""} · ${data.totalPhotos} photo${data.totalPhotos > 1 ? "s" : ""} de pannes`
            : "Aucune image sur ce parc pour l'instant."}
      </p>

      {!isPending &&
        data?.biens.map((b) => (
          <details key={b.id} className="border-line mt-4 rounded-md border" open={data.biens.length === 1}>
            <summary className="hover:bg-highlight flex cursor-pointer items-center gap-3 rounded-md p-4">
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt="" aria-hidden="true" className="size-10 shrink-0 rounded-md object-cover" loading="lazy" />
              ) : (
                <span className="bg-sand text-ink-3 grid size-10 shrink-0 place-items-center rounded-md text-sm font-bold" aria-hidden="true">
                  {b.nom.trim()[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate font-semibold">{b.nom}</span>
                <span className="text-ink-3 block text-xs">
                  {b.ville} · {b.lots.length} lot{b.lots.length > 1 ? "s" : ""}
                </span>
              </span>
            </summary>
            <div className="border-line space-y-5 border-t p-4">
              {b.lots.length === 0 && (
                <p className="text-ink-3 text-sm">Aucun lot dans ce bien.</p>
              )}
              {b.lots.map((l) => (
                <details key={l.id}>
                  <summary className="text-ink cursor-pointer text-sm font-semibold">
                    {l.nom}
                    <span className="text-ink-3 font-normal">
                      {" "}· {l.photos.length} photo{l.photos.length > 1 ? "s" : ""}
                      {l.locataireNom ? ` · occupé par ${l.locataireNom}` : " · libre"}
                    </span>
                  </summary>
                  <div className="mt-2.5 flex flex-wrap items-start gap-4">
                    {l.locataireNom && (
                      <div className="flex items-center gap-2.5">
                        {l.locatairePhotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.locatairePhotoUrl} alt={`${l.locataireNom} — photo`} className="size-9 shrink-0 rounded-full object-cover" loading="lazy" />
                        ) : (
                          <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold" aria-hidden="true">
                            {l.locataireNom.trim()[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                        <span className="text-ink-2 text-sm">{l.locataireNom}</span>
                      </div>
                    )}
                  </div>
                  {l.photos.length > 0 ? (
                    <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {l.photos.map((p, i) => (
                        <Vignette key={`${p.url}-${i}`} src={p.url} legende={`${p.titre} · ${formaterDate(p.date)}`} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-3 mt-2 text-sm">Aucune photo sur ce lot.</p>
                  )}
                </details>
              ))}
            </div>
          </details>
        ))}
    </section>
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
