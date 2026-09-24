/**
 * Petits affichages partagés des écrans admin (badges, formats).
 * Sans logique métier : le calcul vit dans `src/lib/admin/queries.ts`.
 */
import type { AdminAbonnement, AdminCompte } from "@/lib/admin/types";

export const formaterMontant = (n: number) => `${n.toLocaleString("fr-FR")} F`;

export const formaterDate = (iso: string | null) =>
  !iso
    ? "—"
    : new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export type TonBadge = "primary" | "success" | "danger" | "neutre" | "ambre";

const tonsBadge: Record<TonBadge, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutre: "bg-sand text-ink-2",
  ambre: "bg-amber/15 text-amber",
};

export function Badge({ ton, children }: { ton: TonBadge; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tonsBadge[ton]}`}>
      {children}
    </span>
  );
}

export const tonPlan = (plan: string): TonBadge =>
  plan === "business" ? "success" : plan === "pro" ? "primary" : "neutre";

export const libelleStatutCompte: Record<AdminCompte["statut"], string> = {
  payant: "Payant",
  expire_bientot: "Expire bientôt",
  expire: "Expiré",
  quota_atteint: "Quota atteint",
  essentiel: "Essentiel",
};

export const tonStatutCompte = (s: AdminCompte["statut"]): TonBadge =>
  s === "payant"
    ? "success"
    : s === "expire" || s === "quota_atteint"
      ? "danger"
      : s === "expire_bientot"
        ? "ambre"
        : "neutre";

export const libelleStatutAbo: Record<AdminAbonnement["statut"], string> = {
  actif: "Actif",
  expire_bientot: "Expire bientôt",
  expire: "Expiré",
};

export const tonStatutAbo = (s: AdminAbonnement["statut"]): TonBadge =>
  s === "actif" ? "success" : s === "expire_bientot" ? "ambre" : "neutre";
