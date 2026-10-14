/**
 * Fiche de modération d'un signalement : photos, échanges, parties, et
 * tranchement (statut, urgence). Chaque acte est journalisé avec son auteur.
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
import { Badge, formaterDate } from "@/components/admin/ui";
import type { AdminSignalement } from "@/lib/admin/types";
import type { StatutSignalement, UrgenceSignalement } from "@/lib/types";

async function poster(url: string, corps: unknown): Promise<void> {
  const reponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!reponse.ok) {
    const json = (await reponse.json().catch(() => ({}))) as { erreur?: string };
    throw new Error(json.erreur ?? "Action impossible.");
  }
}

/** Mêmes transitions que le propriétaire, plus la réouverture d'un résolu et
 *  l'annulation d'un résolu — le modérateur tranche les cas litigieux, il ne
 *  réécrit pas les dossiers clos (`confirme`, `annule` restent terminaux). */
const TRANSITIONS: Record<string, { statut: StatutSignalement; label: string }[]> = {
  signale: [
    { statut: "pris-en-charge", label: "Prendre en charge" },
    { statut: "annule", label: "Annuler (abus, doublon…)" },
  ],
  "pris-en-charge": [
    { statut: "resolu", label: "Marquer résolu" },
    { statut: "annule", label: "Annuler (abus, doublon…)" },
  ],
  resolu: [
    { statut: "pris-en-charge", label: "Rouvrir" },
    { statut: "annule", label: "Annuler (abus…)" },
  ],
};

const tonStatut = (s: string) =>
  s === "signale" ? ("danger" as const) : s === "pris-en-charge" ? ("ambre" as const) : ("neutre" as const);

function Contenu({ id }: { id: string }) {
  const client = useQueryClient();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [urgence, setUrgence] = useState("");

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "signalement", id],
    queryFn: async () => {
      const reponse = await fetch(`/api/admin/signalements/${id}`);
      if (reponse.status === 404) throw new Error("Dossier introuvable.");
      if (!reponse.ok) throw new Error("Fiche indisponible.");
      return (await reponse.json()) as AdminSignalement;
    },
  });

  const statutMutation = useMutation({
    mutationFn: (statut: StatutSignalement) =>
      poster(`/api/admin/signalements/${id}/statut`, { statut }),
    onSuccess: () => {
      setMessage({ ok: true, texte: "Statut mis à jour — acte journalisé." });
      client.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => setMessage({ ok: false, texte: e.message }),
  });

  const urgenceMutation = useMutation({
    mutationFn: (u: UrgenceSignalement) =>
      poster(`/api/admin/signalements/${id}/urgence`, { urgence: u }),
    onSuccess: () => {
      setMessage({ ok: true, texte: "Urgence mise à jour — acte journalisé." });
      client.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => setMessage({ ok: false, texte: e.message }),
  });

  if (isPending) return <p className="text-ink-3 py-10 text-center text-sm">Chargement du dossier…</p>;
  if (isError || !data)
    return (
      <div className="py-10 text-center">
        <p className="text-ink-2 text-sm">Dossier indisponible.</p>
        <button type="button" onClick={() => refetch()} className="text-primary mt-2 text-sm font-semibold">
          Réessayer
        </button>
      </div>
    );

  const transitions = TRANSITIONS[data.statut] ?? [];
  const occupe = statutMutation.isPending || urgenceMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin?onglet=moderation" className="text-primary text-sm font-semibold no-underline">
          ← Tous les dossiers
        </Link>
        <h1 className="font-display text-ink mt-1 text-3xl font-semibold">{data.titre}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge ton={tonStatut(data.statut)}>{data.statut}</Badge>
          <Badge ton={data.urgence === "haute" ? "danger" : data.urgence === "normale" ? "ambre" : "neutre"}>
            Urgence {data.urgence}
          </Badge>
          <Badge ton="neutre">Signalé le {formaterDate(data.creeLe)}</Badge>
          {data.resoluLe && <Badge ton="neutre">Résolu le {formaterDate(data.resoluLe)}</Badge>}
        </div>
      </div>

      {message && (
        <p className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
          {message.texte}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="border-line bg-surface rounded-md border p-5 lg:col-span-2">
          <h2 className="font-display text-ink text-xl font-semibold">Description</h2>
          <p className="text-ink-2 mt-2 text-sm leading-relaxed whitespace-pre-wrap">{data.description}</p>

          {data.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {data.photos.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt="Photo du signalement"
                  className="border-line aspect-square w-full rounded-md border object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {data.messages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-ink text-sm font-semibold">Échanges ({data.messages.length})</h3>
              <ul className="mt-2 space-y-2">
                {data.messages.map((m, i) => (
                  <li key={i} className="border-line bg-paper rounded-md border p-3 text-sm">
                    <span className="text-ink-3 text-xs font-semibold uppercase">{m.auteur}</span>
                    <p className="text-ink-2 mt-1 whitespace-pre-wrap">{m.corps}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="border-line bg-surface rounded-md border p-5">
            <h2 className="font-display text-ink text-xl font-semibold">Parties</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-ink-3 text-xs uppercase">Logement</dt>
                <dd className="text-ink font-medium">
                  {data.lotNom} · {data.bienNom} · {data.ville}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3 text-xs uppercase">Propriétaire</dt>
                <dd>
                  <span className="text-ink font-medium">{data.proprietaireNom}</span>{" "}
                  <span className="text-ink-3">{data.proprietaireEmail}</span>
                  {data.proprietaireId && (
                    <>
                      {" · "}
                      <Link href={`/admin/comptes/${data.proprietaireId}`} className="text-primary font-semibold no-underline">
                        Fiche compte
                      </Link>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-3 text-xs uppercase">Locataire</dt>
                <dd className="text-ink font-medium">
                  {data.locataireNom}{" "}
                  <span className="text-ink-3 font-normal">{data.locataireTelephone}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-line bg-surface rounded-md border p-5">
            <h2 className="font-display text-ink text-xl font-semibold">Trancher</h2>
            {transitions.length === 0 ? (
              <p className="text-ink-3 mt-2 text-sm">Dossier clos — plus aucune transition.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {transitions.map((t) => (
                  <button
                    key={t.statut}
                    type="button"
                    disabled={occupe}
                    onClick={() => {
                      if (window.confirm(`Passer ce dossier en « ${t.statut} » ? Acte journalisé.`)) {
                        setMessage(null);
                        statutMutation.mutate(t.statut);
                      }
                    }}
                    className="border-line text-ink hover:bg-highlight rounded-md border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <select
                value={urgence || data.urgence}
                onChange={(e) => setUrgence(e.target.value)}
                className="border-line bg-surface text-ink flex-1 rounded-md border px-3 py-2 text-sm"
                aria-label="Niveau d'urgence"
                disabled={occupe}
              >
                {["basse", "normale", "haute"].map((u) => (
                  <option key={u} value={u}>
                    Urgence {u}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={occupe || !urgence || urgence === data.urgence}
                onClick={() => {
                  setMessage(null);
                  urgenceMutation.mutate(urgence as UrgenceSignalement);
                }}
                className="bg-primary text-on-primary hover:bg-primary-hi rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AdminSignalementDetail({ id }: { id: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <Contenu id={id} />
    </QueryClientProvider>
  );
}
