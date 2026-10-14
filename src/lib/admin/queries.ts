/**
 * Agrégations admin — Supabase comme backend, clé de service.
 *
 * RLS est contournée ici par construction : ces fonctions ne sont appelées
 * que depuis les routes /api/admin/*, elles-mêmes gardées par `verifierAdminApi`.
 * Ne jamais les importer depuis un composant client (`server-only` le garantit).
 */
import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { planDepuisUuid, planEffectif, uuidDuPlan, type PlanId } from "@/lib/plans";
import {
  diagnostiquerConfiguration,
  geniuspayBacASable,
  estReferenceGeniusPay,
} from "@/lib/paiement/geniuspay";
import type {
  AdminAbonnement,
  AdminCompte,
  AdminCompteDetail,
  AdminDossier,
  AdminEvenement,
  AdminOverview,
  AdminParc,
  AdminRecherche,
  AdminSignalement,
  AdminSignalementListe,
  AdminSysteme,
  AlerteCompte,
  StatutCompte,
} from "@/lib/admin/types";
import type { StatutSignalement, UrgenceSignalement } from "@/lib/types";
import { isAdminEmail } from "@/lib/admin/guard";

interface PlanRef {
  id: string;
  slug: PlanId;
  nom: string;
  prix: number;
  max: number | null;
}

const MS_JOUR = 24 * 60 * 60 * 1000;

function cleMois(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function libelleMois(cle: string): string {
  const [a, m] = cle.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

function douzeDerniersMois(): string[] {
  const cles: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 11; i >= 0; i--) {
    const c = new Date(d.getFullYear(), d.getMonth() - i, 1);
    cles.push(cleMois(c));
  }
  return cles;
}

async function referentielPlans(sb: ReturnType<typeof supabaseServer>): Promise<{
  plans: PlanRef[];
  parId: Map<string, PlanRef>;
  parSlug: Map<string, PlanRef>;
}> {
  const { data } = await sb.from("plan").select("id, slug, nom, prix_fcfa, max_baux");
  const plans: PlanRef[] = (data ?? []).map((p) => ({
    id: p.id,
    slug: (p.slug ?? "essentiel") as PlanId,
    nom: p.nom,
    prix: p.prix_fcfa,
    max: p.max_baux,
  }));
  return {
    plans,
    parId: new Map(plans.map((p) => [p.id, p])),
    parSlug: new Map(plans.map((p) => [p.slug, p])),
  };
}

interface BaseParc {
  biensParProp: Map<string, number>;
  bauxActifsParProp: Map<string, number>;
  nbBiens: number;
  nbLots: number;
  nbBauxActifs: number;
}

/** Cartographie du parc : biens et baux actifs rattachés à chaque propriétaire. */
async function chargerParc(sb: ReturnType<typeof supabaseServer>): Promise<BaseParc> {
  const [{ data: biens }, { data: lots }, { data: baux }] = await Promise.all([
    sb.from("bien").select("id, proprietaire_id").limit(5000),
    sb.from("lot").select("id, bien_id").limit(5000),
    sb.from("bail").select("id, lot_id, statut").eq("statut", "actif").limit(5000),
  ]);

  const propDuBien = new Map<string, string>();
  const biensParProp = new Map<string, number>();
  for (const b of biens ?? []) {
    propDuBien.set(b.id, b.proprietaire_id);
    biensParProp.set(b.proprietaire_id, (biensParProp.get(b.proprietaire_id) ?? 0) + 1);
  }

  const propDuLot = new Map<string, string>();
  for (const l of lots ?? []) {
    const prop = propDuBien.get(l.bien_id);
    if (prop) propDuLot.set(l.id, prop);
  }

  const bauxActifsParProp = new Map<string, number>();
  for (const bail of baux ?? []) {
    const prop = propDuLot.get(bail.lot_id);
    if (prop) bauxActifsParProp.set(prop, (bauxActifsParProp.get(prop) ?? 0) + 1);
  }

  return {
    biensParProp,
    bauxActifsParProp,
    nbBiens: biens?.length ?? 0,
    nbLots: lots?.length ?? 0,
    nbBauxActifs: baux?.length ?? 0,
  };
}

function statutDuCompte(
  effectif: PlanId,
  paye: PlanId,
  expireLe: string | null,
  bauxActifs: number,
  max: number | null,
  maintenant: number,
): { statut: StatutCompte; quota: AdminCompte["quota"] } {
  const quota: AdminCompte["quota"] =
    max === null ? "ok" : bauxActifs >= max ? "atteint" : bauxActifs / max >= 0.8 ? "proche" : "ok";

  if (paye !== "essentiel" && effectif === "essentiel") return { statut: "expire", quota };
  if (quota === "atteint" && max !== null) return { statut: "quota_atteint", quota };
  if (expireLe && paye !== "essentiel") {
    const reste = new Date(expireLe).getTime() - maintenant;
    if (reste > 0 && reste <= 7 * MS_JOUR) return { statut: "expire_bientot", quota };
  }
  if (effectif !== "essentiel") return { statut: "payant", quota };
  return { statut: "essentiel", quota };
}

/* ---------------------------------------------------------- vue d'ensemble */

export async function getAdminOverview(): Promise<AdminOverview> {
  const sb = supabaseServer();
  const maintenant = Date.now();
  const { parId, parSlug } = await referentielPlans(sb);

  const [{ data: proprietaires }, { data: abonnements }, parc, { count: nbLocataires }] =
    await Promise.all([
      sb
        .from("proprietaire")
        .select("id, nom, email, cree_le, plan_id, plan_expire_le, suspendu_le")
        .is("supprime_le", null)
        .order("cree_le", { ascending: false })
        .limit(2000),
      sb
        .from("abonnement")
        .select("id, proprietaire_id, montant_fcfa, cree_le, periode_fin")
        .order("cree_le", { ascending: false })
        .limit(2000),
      chargerParc(sb),
      sb.from("locataire").select("id", { count: "exact", head: true }),
    ]);

  const lignes = proprietaires ?? [];
  const abos = abonnements ?? [];

  const payeDe = (planId: string): PlanId => parId.get(planId)?.slug ?? planDepuisUuid(planId);
  const effectifDe = (planId: string, expireLe: string | null): PlanId =>
    planEffectif(payeDe(planId), expireLe, new Date(maintenant));

  // --- MRR : ce que les plans effectifs rapportent chaque mois ---
  let mrr = 0;
  const repartition: Record<PlanId, number> = { essentiel: 0, pro: 0, business: 0 };
  for (const p of lignes) {
    const eff = effectifDe(p.plan_id, p.plan_expire_le);
    repartition[eff] += 1;
    mrr += parSlug.get(eff)?.prix ?? 0;
  }

  // --- Séries 12 mois : revenus encaissés + inscriptions ---
  const mois = douzeDerniersMois();
  const revenusParMois = new Map(mois.map((m) => [m, 0]));
  let totalEncaisse = 0;
  for (const a of abos) {
    totalEncaisse += a.montant_fcfa;
    const cle = (a.cree_le ?? "").slice(0, 7);
    if (revenusParMois.has(cle)) revenusParMois.set(cle, (revenusParMois.get(cle) ?? 0) + a.montant_fcfa);
  }
  const inscriptionsParMois = new Map(mois.map((m) => [m, 0]));
  for (const p of lignes) {
    const cle = (p.cree_le ?? "").slice(0, 7);
    if (inscriptionsParMois.has(cle)) inscriptionsParMois.set(cle, (inscriptionsParMois.get(cle) ?? 0) + 1);
  }

  const moisCourant = cleMois(new Date(maintenant));
  const dPrec = new Date(maintenant);
  dPrec.setMonth(dPrec.getMonth() - 1);
  const revenuMois = revenusParMois.get(moisCourant) ?? 0;
  const revenuMoisPrecedent = revenusParMois.get(cleMois(dPrec)) ?? 0;

  // --- Funnel : inscription → bien → bail → paiement ---
  // Seuls les vrais paiements comptent : les gestes admin (montant 0) ne font
  // pas d'un compte un client payant.
  const payantsSet = new Set(
    abos.filter((a) => a.montant_fcfa > 0).map((a) => a.proprietaire_id),
  );
  let avecBien = 0;
  let avecBail = 0;
  for (const p of lignes) {
    if ((parc.biensParProp.get(p.id) ?? 0) > 0) avecBien += 1;
    if ((parc.bauxActifsParProp.get(p.id) ?? 0) > 0) avecBail += 1;
  }

  // --- Alertes : les 8 premiers de chaque file ---
  const expire7j: AlerteCompte[] = [];
  const expiresRetombes: AlerteCompte[] = [];
  const quotaAtteints: AlerteCompte[] = [];
  const sansBien7j: AlerteCompte[] = [];
  for (const p of lignes) {
    const paye = payeDe(p.plan_id);
    const eff = effectifDe(p.plan_id, p.plan_expire_le);
    const baux = parc.bauxActifsParProp.get(p.id) ?? 0;
    const max = parSlug.get(eff)?.max ?? parSlug.get(paye)?.max ?? null;
    const base = { id: p.id, nom: p.nom, email: p.email };

    if (paye !== "essentiel" && eff === "essentiel") {
      if (expiresRetombes.length < 8)
        expiresRetombes.push({ ...base, detail: `${paye} expiré — retombé Essentiel` });
      continue;
    }
    if (p.plan_expire_le && paye !== "essentiel") {
      const reste = new Date(p.plan_expire_le).getTime() - maintenant;
      if (reste > 0 && reste <= 7 * MS_JOUR && expire7j.length < 8) {
        const jours = Math.ceil(reste / MS_JOUR);
        expire7j.push({ ...base, detail: `${paye} expire dans ${jours} j` });
      }
    }
    if (max !== null && baux >= max && quotaAtteints.length < 8) {
      quotaAtteints.push({ ...base, detail: `${baux}/${max} baux — upsell ${paye === "essentiel" ? "Pro" : "Business"}` });
    }
    const ageJours = (maintenant - new Date(p.cree_le).getTime()) / MS_JOUR;
    if (ageJours >= 7 && (parc.biensParProp.get(p.id) ?? 0) === 0 && sansBien7j.length < 8) {
      sansBien7j.push({ ...base, detail: `inscrit depuis ${Math.floor(ageJours)} j, aucun bien` });
    }
  }

  const nouveauxJ7 = lignes.filter((p) => maintenant - new Date(p.cree_le).getTime() <= 7 * MS_JOUR).length;
  const nouveauxJ30 = lignes.filter((p) => maintenant - new Date(p.cree_le).getTime() <= 30 * MS_JOUR).length;

  return {
    totaux: {
      comptes: lignes.length,
      nouveauxJ7,
      nouveauxJ30,
      biens: parc.nbBiens,
      lots: parc.nbLots,
      bauxActifs: parc.nbBauxActifs,
      locataires: nbLocataires ?? 0,
    },
    mrr,
    revenuMois,
    revenuMoisPrecedent,
    totalEncaisse,
    payants: payantsSet.size,
    conversion: lignes.length ? Math.round((payantsSet.size / lignes.length) * 100) : 0,
    repartition,
    serieRevenus: mois.map((m) => ({ periode: m, label: libelleMois(m), montant: revenusParMois.get(m) ?? 0 })),
    serieInscriptions: mois.map((m) => ({ periode: m, label: libelleMois(m), nb: inscriptionsParMois.get(m) ?? 0 })),
    funnel: { avecBien, avecBail, payants: payantsSet.size },
    alertes: { expire7j, expiresRetombes, quotaAtteints, sansBien7j },
  };
}

/* ---------------------------------------------------------------- comptes */

export async function getAdminComptes(): Promise<AdminCompte[]> {
  const sb = supabaseServer();
  const maintenant = Date.now();
  const { parId, parSlug } = await referentielPlans(sb);

  const [{ data: proprietaires }, { data: abonnements }, parc] = await Promise.all([
    sb
      .from("proprietaire")
      .select("id, nom, email, cree_le, plan_id, plan_expire_le, suspendu_le")
      .is("supprime_le", null)
      .order("cree_le", { ascending: false })
      .limit(2000),
    sb.from("abonnement").select("proprietaire_id, montant_fcfa, cree_le").limit(5000),
    chargerParc(sb),
  ]);

  const payeParProp = new Map<string, { total: number; nb: number; dernier: string | null }>();
  for (const a of abonnements ?? []) {
    // Les gestes admin (montant 0) restent visibles dans l'historique mais ne
    // gonflent ni le compteur d'abonnements ni le dernier paiement.
    if (a.montant_fcfa <= 0) continue;
    const e = payeParProp.get(a.proprietaire_id) ?? { total: 0, nb: 0, dernier: null };
    e.total += a.montant_fcfa;
    e.nb += 1;
    if (!e.dernier || (a.cree_le ?? "") > e.dernier) e.dernier = a.cree_le;
    payeParProp.set(a.proprietaire_id, e);
  }

  return (proprietaires ?? []).map((p) => {
    const paye: AdminCompte["planPaye"] = parId.get(p.plan_id)?.slug ?? planDepuisUuid(p.plan_id);
    const planEffectifV = planEffectif(paye, p.plan_expire_le, new Date(maintenant));
    const max = parSlug.get(planEffectifV)?.max ?? null;
    const baux = parc.bauxActifsParProp.get(p.id) ?? 0;
    const { statut, quota } = statutDuCompte(planEffectifV, paye, p.plan_expire_le, baux, max, maintenant);
    const payeInfo = payeParProp.get(p.id);

    return {
      id: p.id,
      nom: p.nom,
      email: p.email,
      creeLe: p.cree_le,
      planPaye: paye,
      planEffectif: planEffectifV,
      planExpireLe: p.plan_expire_le,
      nbBiens: parc.biensParProp.get(p.id) ?? 0,
      nbBauxActifs: baux,
      maxBaux: max,
      totalPaye: payeInfo?.total ?? 0,
      nbAbonnements: payeInfo?.nb ?? 0,
      dernierPaiementLe: payeInfo?.dernier ?? null,
      statut,
      quota,
      suspendu: p.suspendu_le !== null,
      suspenduLe: p.suspendu_le,
    };
  });
}

/* ----------------------------------------------------------- abonnements */

export async function getAdminAbonnements(): Promise<AdminAbonnement[]> {
  const sb = supabaseServer();
  const maintenant = Date.now();
  const { parId } = await referentielPlans(sb);

  const [{ data: abonnements }, { data: proprietaires }] = await Promise.all([
    sb
      .from("abonnement")
      .select("id, proprietaire_id, plan_id, montant_fcfa, cree_le, periode_debut, periode_fin, reference_externe")
      .order("cree_le", { ascending: false })
      .limit(1000),
    sb.from("proprietaire").select("id, nom, email").is("supprime_le", null).limit(2000),
  ]);

  const propParId = new Map((proprietaires ?? []).map((p) => [p.id, p]));

  return (abonnements ?? []).map((a) =>
    mapperAbonnement(
      a,
      propParId.get(a.proprietaire_id)?.nom ?? "—",
      propParId.get(a.proprietaire_id)?.email ?? "—",
      parId,
      maintenant,
    ),
  );
}

interface LigneAbonnement {
  id: string;
  cree_le: string;
  montant_fcfa: number;
  periode_debut: string;
  periode_fin: string;
  proprietaire_id: string;
  plan_id: string;
  reference_externe: string;
}

/** Un geste saisi à la main depuis /admin se reconnaît à sa référence. */
function estGesteAdmin(referenceExterne: string): boolean {
  return referenceExterne.startsWith("geste-admin-");
}

function mapperAbonnement(
  a: LigneAbonnement,
  proprietaireNom: string,
  proprietaireEmail: string,
  parId: Map<string, PlanRef>,
  maintenant: number,
): AdminAbonnement {
  const plan = parId.get(a.plan_id);
  const slug = plan?.slug ?? planDepuisUuid(a.plan_id);
  const fin = new Date(a.periode_fin).getTime();
  const joursRestants = Math.ceil((fin - maintenant) / MS_JOUR);
  const statut: AdminAbonnement["statut"] =
    joursRestants <= 0 ? "expire" : joursRestants <= 7 ? "expire_bientot" : "actif";

  return {
    id: a.id,
    creeLe: a.cree_le,
    montantFcfa: a.montant_fcfa,
    periodeDebut: a.periode_debut,
    periodeFin: a.periode_fin,
    proprietaireId: a.proprietaire_id,
    proprietaireNom,
    proprietaireEmail,
    planSlug: slug,
    planNom: plan?.nom ?? slug,
    statut,
    joursRestants,
    gesteAdmin: estGesteAdmin(a.reference_externe),
  };
}

/* ------------------------------------------------------- fiche d'un compte */

export async function getAdminCompteDetail(id: string): Promise<AdminCompteDetail | null> {
  const sb = supabaseServer();
  const maintenant = Date.now();
  const { parId, parSlug } = await referentielPlans(sb);

  const { data: p } = await sb
    .from("proprietaire")
    .select("id, nom, email, cree_le, plan_id, plan_expire_le, suspendu_le")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();
  if (!p) return null;

  const { data: biens } = await sb
    .from("bien")
    .select("id, nom, ville")
    .eq("proprietaire_id", id)
    .order("cree_le", { ascending: true })
    .limit(500);
  const bienIds = (biens ?? []).map((b) => b.id);

  const [{ data: lots }, { data: abonnements }, { data: locataires }] = await Promise.all([
    bienIds.length
      ? sb.from("lot").select("id, bien_id, nom, composition").in("bien_id", bienIds).limit(1000)
      : Promise.resolve({ data: [] as { id: string; bien_id: string; nom: string; composition: string }[] }),
    sb
      .from("abonnement")
      .select("id, proprietaire_id, plan_id, montant_fcfa, cree_le, periode_debut, periode_fin, reference_externe")
      .eq("proprietaire_id", id)
      .order("cree_le", { ascending: false })
      .limit(200),
    sb.from("locataire").select("id, nom").eq("proprietaire_id", id).limit(1000),
  ]);
  const lotIds = (lots ?? []).map((l) => l.id);

  const [{ data: baux }, { data: versements }, { data: signalements }] = await Promise.all([
    lotIds.length
      ? sb
          .from("bail")
          .select("id, lot_id, locataire_id, statut, loyer_mensuel_fcfa")
          .in("lot_id", lotIds)
          .limit(1000)
      : Promise.resolve({
          data: [] as {
            id: string;
            lot_id: string;
            locataire_id: string;
            statut: string;
            loyer_mensuel_fcfa: number;
          }[],
        }),
    // Le GMV ne compte que l'argent réellement encaissé.
    lotIds.length
      ? sb
          .from("versement")
          .select("montant_total_fcfa, bail_id")
          .eq("statut", "confirme")
          .limit(5000)
      : Promise.resolve({ data: [] as { montant_total_fcfa: number; bail_id: string }[] }),
    lotIds.length
      ? sb
          .from("signalement")
          .select("id")
          .in("lot_id", lotIds)
          .in("statut", ["signale", "pris-en-charge"])
          .limit(500)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  // Les versements ne portent pas le propriétaire : on ne garde que ceux dont
  // le bail appartient au parc.
  const bailsDuParc = new Set((baux ?? []).map((b) => b.id));
  const gmvConfirmeFcfa = (versements ?? [])
    .filter((v) => bailsDuParc.has(v.bail_id))
    .reduce((s, v) => s + v.montant_total_fcfa, 0);

  const locataireParId = new Map((locataires ?? []).map((l) => [l.id, l.nom]));
  const bailActifParLot = new Map<
    string,
    { id: string; locataire_id: string; statut: string; loyer_mensuel_fcfa: number }
  >();
  for (const b of baux ?? []) {
    if (b.statut === "actif") bailActifParLot.set(b.lot_id, b);
  }

  const biensDetail: AdminCompteDetail["biens"] = (biens ?? []).map((b) => ({
    id: b.id,
    nom: b.nom,
    ville: b.ville,
    lots: (lots ?? [])
      .filter((l) => l.bien_id === b.id)
      .map((l) => {
        const bail = bailActifParLot.get(l.id);
        return {
          id: l.id,
          nom: l.nom,
          composition: l.composition,
          bail: bail
            ? {
                id: bail.id,
                statut: bail.statut as "actif" | "termine",
                loyerMensuelFcfa: bail.loyer_mensuel_fcfa,
                locataireNom: locataireParId.get(bail.locataire_id) ?? "—",
              }
            : null,
        };
      }),
  }));

  const paye: AdminCompte["planPaye"] = parId.get(p.plan_id)?.slug ?? planDepuisUuid(p.plan_id);
  const effectif = planEffectif(paye, p.plan_expire_le, new Date(maintenant));
  const max = parSlug.get(effectif)?.max ?? null;
  const bauxActifs = (baux ?? []).filter((b) => b.statut === "actif").length;
  const { statut, quota } = statutDuCompte(effectif, paye, p.plan_expire_le, bauxActifs, max, maintenant);

  const payes = (abonnements ?? []).filter((a) => a.montant_fcfa > 0);
  const compte: AdminCompte = {
    id: p.id,
    nom: p.nom,
    email: p.email,
    creeLe: p.cree_le,
    planPaye: paye,
    planEffectif: effectif,
    planExpireLe: p.plan_expire_le,
    nbBiens: (biens ?? []).length,
    nbBauxActifs: bauxActifs,
    maxBaux: max,
    totalPaye: payes.reduce((s, a) => s + a.montant_fcfa, 0),
    nbAbonnements: payes.length,
    dernierPaiementLe: payes[0]?.cree_le ?? null,
    statut,
    quota,
    suspendu: p.suspendu_le !== null,
    suspenduLe: p.suspendu_le,
  };

  return {
    compte,
    biens: biensDetail,
    abonnements: (abonnements ?? []).map((a) =>
      mapperAbonnement(a, p.nom, p.email, parId, maintenant),
    ),
    nbLocataires: (locataires ?? []).length,
    signalementsOuverts: (signalements ?? []).length,
    gmvConfirmeFcfa,
  };
}

/* ---------------------------------------------------------- gestes admin */

/**
 * Tracer un geste commercial dans `abonnement` plutôt que nulle part.
 *
 * La table n'a pas de colonne « origine » : la référence `geste-admin-*`
 * distingue ces lignes des vrais paiements GeniusPay. Montant 0, donc aucun
 * impact sur le total encaissé, le MRR ou la conversion — et `un geste reste
 * visible dans l'historique de la fiche compte.
 */
async function tracerGesteAdmin(
  sb: ReturnType<typeof supabaseServer>,
  proprietaireId: string,
  planId: string,
  debut: Date,
  fin: Date,
): Promise<string> {
  const reference = `geste-admin-${crypto.randomUUID()}`;
  const { error } = await sb.from("abonnement").insert({
    proprietaire_id: proprietaireId,
    plan_id: planId,
    montant_fcfa: 0,
    reference_externe: reference,
    periode_debut: debut.toISOString(),
    periode_fin: fin.toISOString(),
  });
  if (error) throw new Error("Geste non tracé.");
  return reference;
}

function validerJours(jours: unknown): number {
  const n = typeof jours === "number" ? jours : Number(jours);
  if (!Number.isInteger(n) || n < 1 || n > 365) throw new Error("Durée invalide (1 à 365 jours).");
  return n;
}

/**
 * Changer le plan d'un compte à la main : geste commercial, SAV, test.
 * Essentiel ne porte pas d'échéance ; un plan payant repart pour `jours`.
 */
type ActionJournalisee = AdminEvenement["action"];

async function journaliserGesteAdmin(
  proprietaireId: string | null,
  acteurEmail: string,
  action: ActionJournalisee,
  resume: string,
): Promise<void> {
  // Le journal ne doit jamais faire échouer le geste : en cas d'erreur on
  // perd une ligne d'audit, pas l'action elle-même.
  try {
    await supabaseServer().from("evenement_admin").insert({
      proprietaire_id: proprietaireId,
      acteur_email: acteurEmail,
      action,
      resume,
    });
  } catch {
    // Rien à faire de plus : l'abonnement à 0 F garde déjà la trace brute.
  }
}

export async function appliquerPlanAdmin(
  proprietaireId: string,
  plan: PlanId,
  joursBruts: unknown,
  acteurEmail: string,
): Promise<{ expireLe: string | null }> {
  if (plan !== "essentiel" && plan !== "pro" && plan !== "business") {
    throw new Error("Palier inconnu.");
  }
  const sb = supabaseServer();
  const { data: p } = await sb
    .from("proprietaire")
    .select("id")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!p) throw new Error("Compte introuvable.");

  const debut = new Date();
  const expireLe = plan === "essentiel" ? null : new Date(debut.getTime() + validerJours(joursBruts) * MS_JOUR);

  const { error } = await sb
    .from("proprietaire")
    .update({ plan_id: uuidDuPlan(plan), plan_expire_le: expireLe?.toISOString() ?? null })
    .eq("id", proprietaireId);
  if (error) throw new Error("Changement de palier impossible.");

  if (expireLe) await tracerGesteAdmin(sb, proprietaireId, uuidDuPlan(plan), debut, expireLe);
  await journaliserGesteAdmin(
    proprietaireId,
    acteurEmail,
    "plan_change",
    expireLe
      ? `Plan ${plan} appliqué (${expireLe.toLocaleDateString("fr-FR")})`
      : "Retour au plan Essentiel",
  );
  return { expireLe: expireLe?.toISOString() ?? null };
}

/**
 * Prolonger l'abonnement en cours : la nouvelle fin part du plus tard entre
 * maintenant et l'échéance actuelle — on ne punit pas celui qui prolonge tôt.
 */
export async function prolongerAbonnementAdmin(
  proprietaireId: string,
  joursBruts: unknown,
  acteurEmail: string,
): Promise<{ expireLe: string }> {
  const jours = validerJours(joursBruts);
  const sb = supabaseServer();
  const { data: p } = await sb
    .from("proprietaire")
    .select("id, plan_id, plan_expire_le")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!p) throw new Error("Compte introuvable.");

  const { parId } = await referentielPlans(sb);
  const paye = parId.get(p.plan_id)?.slug ?? planDepuisUuid(p.plan_id);
  if (paye === "essentiel") throw new Error("Un compte Essentiel n'a rien à prolonger.");

  const base = Math.max(Date.now(), p.plan_expire_le ? new Date(p.plan_expire_le).getTime() : 0);
  const fin = new Date(base + jours * MS_JOUR);

  const { error } = await sb
    .from("proprietaire")
    .update({ plan_expire_le: fin.toISOString() })
    .eq("id", proprietaireId);
  if (error) throw new Error("Prolongation impossible.");

  await tracerGesteAdmin(sb, proprietaireId, p.plan_id, new Date(), fin);
  await journaliserGesteAdmin(
    proprietaireId,
    acteurEmail,
    "prolongation",
    `Prolongation de ${jours} jours (${fin.toLocaleDateString("fr-FR")})`,
  );
  return { expireLe: fin.toISOString() };
}

/* -------------------------------------------------------------- restriction */

/**
 * Restriction d'un compte : suspendu de la session ET de RLS, données
 * intactes. Le verrou RLS tient dans `proprietaire_courant()` (un suspendu y
 * vaut NULL) ; la session est résolue à null côté applicatif.
 *
 * Garde-fou : on ne suspend jamais un e-mail d'équipe — se couper l'accès
 * admin à soi-même n'a pas de bouton « annuler » raisonnable.
 */
export async function suspenderCompteAdmin(
  proprietaireId: string,
  acteurEmail: string,
  motif: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const sb = supabaseServer();
  const { data: p } = await sb
    .from("proprietaire")
    .select("id, email, suspendu_le")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!p) return { ok: false, erreur: "Compte introuvable." };
  if (isAdminEmail(p.email)) return { ok: false, erreur: "Un compte d'équipe ne se suspend pas." };
  if (p.suspendu_le) return { ok: false, erreur: "Compte déjà suspendu." };

  const { error } = await sb
    .from("proprietaire")
    .update({ suspendu_le: new Date().toISOString() })
    .eq("id", proprietaireId);
  if (error) return { ok: false, erreur: "Suspension impossible." };

  await journaliserGesteAdmin(
    proprietaireId,
    acteurEmail,
    "suspension",
    motif.trim() ? `Compte suspendu — ${motif.trim().slice(0, 200)}` : "Compte suspendu",
  );
  return { ok: true };
}

export async function reintegrerCompteAdmin(
  proprietaireId: string,
  acteurEmail: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const sb = supabaseServer();
  const { data: p } = await sb
    .from("proprietaire")
    .select("id, suspendu_le")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!p) return { ok: false, erreur: "Compte introuvable." };
  if (!p.suspendu_le) return { ok: false, erreur: "Compte non suspendu." };

  const { error } = await sb
    .from("proprietaire")
    .update({ suspendu_le: null })
    .eq("id", proprietaireId);
  if (error) return { ok: false, erreur: "Réintégration impossible." };

  await journaliserGesteAdmin(proprietaireId, acteurEmail, "reintegration", "Compte réintégré");
  return { ok: true };
}

/* ----------------------------------------------------------------- journal */

export async function getAdminJournal(): Promise<AdminEvenement[]> {
  const sb = supabaseServer();
  const [{ data: evenements }, { data: proprietaires }] = await Promise.all([
    sb.from("evenement_admin").select("*").order("cree_le", { ascending: false }).limit(200),
    sb.from("proprietaire").select("id, email").is("supprime_le", null).limit(2000),
  ]);
  const emailParId = new Map((proprietaires ?? []).map((p) => [p.id, p.email]));
  return (evenements ?? []).map((e) => ({
    id: e.id,
    creeLe: e.cree_le,
    acteurEmail: e.acteur_email,
    action: e.action as AdminEvenement["action"],
    proprietaireEmail: e.proprietaire_id
      ? (emailParId.get(e.proprietaire_id) ?? "compte supprimé")
      : "—",
    resume: e.resume,
  }));
}

/* --------------------------------------------------------------------- parc */

/**
 * Santé locative globale : occupation, villes, argent déclaré en attente et
 * signalements ouverts — ce qu'un support regarde chaque matin.
 */
export async function getAdminParc(): Promise<AdminParc> {
  const sb = supabaseServer();
  const [{ data: biens }, { data: lots }, { data: proprietaires }] = await Promise.all([
    sb.from("bien").select("id, ville, proprietaire_id").limit(2000),
    sb.from("lot").select("id, bien_id").limit(5000),
    sb.from("proprietaire").select("id, email").is("supprime_le", null).limit(2000),
  ]);
  const emailParId = new Map((proprietaires ?? []).map((p) => [p.id, p.email]));
  const bienParId = new Map((biens ?? []).map((b) => [b.id, b]));
  const propDuBien = new Map((biens ?? []).map((b) => [b.id, b.proprietaire_id]));
  const villeDuLot = new Map<string, string>();
  for (const l of lots ?? []) {
    const bien = bienParId.get(l.bien_id);
    if (bien) villeDuLot.set(l.id, bien.ville);
  }
  const lotIds = (lots ?? []).map((l) => l.id);

  const [{ data: baux }, { data: versements }, { data: signalements }] = await Promise.all([
    sb.from("bail").select("id, lot_id, statut").limit(5000),
    sb
      .from("versement")
      .select("id, bail_id, montant_total_fcfa, declare_le, reference_externe")
      .eq("statut", "initie")
      .order("declare_le", { ascending: true })
      .limit(200),
    lotIds.length
      ? sb
          .from("signalement")
          .select("id, lot_id, titre, urgence, cree_le")
          .in("lot_id", lotIds)
          .in("statut", ["signale", "pris-en-charge"])
          .order("cree_le", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as { id: string; lot_id: string; titre: string; urgence: string; cree_le: string }[] }),
  ]);

  const bailParId = new Map((baux ?? []).map((b) => [b.id, b]));
  const bauxActifs = (baux ?? []).filter((b) => b.statut === "actif").length;
  const nbLots = lots?.length ?? 0;

  const parVille = new Map<string, number>();
  for (const b of biens ?? []) parVille.set(b.ville, (parVille.get(b.ville) ?? 0) + 1);
  const villes = [...parVille.entries()]
    .map(([ville, nbBiens]) => ({ ville, nbBiens }))
    .sort((a, b) => b.nbBiens - a.nbBiens)
    .slice(0, 10);

  const bienDuLot = new Map((lots ?? []).map((l) => [l.id, l.bien_id]));
  const enAttente = (versements ?? []).map((v) => {
    const bail = bailParId.get(v.bail_id);
    const bienId = bail?.lot_id ? bienDuLot.get(bail.lot_id) : undefined;
    const propId = bienId ? propDuBien.get(bienId) : undefined;
    return {
      id: v.id,
      proprietaireEmail: propId ? (emailParId.get(propId) ?? "—") : "—",
      montantFcfa: v.montant_total_fcfa,
      depuisLe: v.declare_le,
      enLigne: estReferenceGeniusPay(v.reference_externe ?? undefined),
    };
  });

  const parUrgence: Record<string, number> = {};
  for (const s of signalements ?? []) {
    const cle = s.urgence ?? "non renseignée";
    parUrgence[cle] = (parUrgence[cle] ?? 0) + 1;
  }

  return {
    biens: biens?.length ?? 0,
    lots: nbLots,
    bauxActifs,
    tauxOccupation: nbLots ? Math.round((bauxActifs / nbLots) * 100) : 0,
    villes,
    enAttente,
    totalEnAttenteFcfa: enAttente.reduce((s, v) => s + v.montantFcfa, 0),
    signalementsOuverts: (signalements ?? []).length,
    signalementsParUrgence: parUrgence,
    signalementsRecents: (signalements ?? []).slice(0, 20).map((s) => ({
      id: s.id,
      titre: s.titre,
      urgence: s.urgence ?? "non renseignée",
      ville: villeDuLot.get(s.lot_id) ?? "—",
      creeLe: s.cree_le,
    })),
  };
}

/* --------------------------------------------------------------- moderation */

/**
 * Transitions autorisées au modérateur : celles du propriétaire, plus la
 * réouverture d'un dossier marqué résolu à tort et l'annulation d'un résolu
 * abusif. `confirme` et `annule` restent terminaux — rouvrir un dossier clos
 * par le locataire ou effacer une annulation réécrirait l'histoire.
 */
const TRANSITIONS_MODERATION: Record<string, StatutSignalement[]> = {
  signale: ["pris-en-charge", "annule"],
  "pris-en-charge": ["resolu", "annule"],
  resolu: ["pris-en-charge", "annule"],
};

const URGENCES: UrgenceSignalement[] = ["basse", "normale", "haute"];

export async function getAdminSignalements(): Promise<AdminSignalementListe[]> {
  const sb = supabaseServer();
  const { data: signalements } = await sb
    .from("signalement")
    .select("id, titre, lot_id, urgence, statut, cree_le")
    .order("cree_le", { ascending: false })
    .limit(500);
  if (!signalements?.length) return [];

  // Les signalements portent des lots, pas des biens : on remonte lot →
  // bien → ville en deux requêtes indexées plutôt qu'en boucle.
  const { data: lots } = await sb
    .from("lot")
    .select("id, bien_id")
    .in("id", [...new Set(signalements.map((s) => s.lot_id))]);
  const bienIds = [...new Set((lots ?? []).map((l) => l.bien_id))];
  const { data: biens } = bienIds.length
    ? await sb.from("bien").select("id, ville").in("id", bienIds)
    : { data: [] as { id: string; ville: string }[] };
  const villeDuBien = new Map((biens ?? []).map((b) => [b.id, b.ville]));
  const bienDuLot = new Map((lots ?? []).map((l) => [l.id, l.bien_id]));

  return signalements.map((s) => ({
    id: s.id,
    titre: s.titre,
    ville: villeDuBien.get(bienDuLot.get(s.lot_id) ?? "") ?? "—",
    urgence: s.urgence ?? "non renseignée",
    statut: s.statut,
    creeLe: s.cree_le,
  }));
}

export async function getAdminSignalement(id: string): Promise<AdminSignalement | null> {
  const sb = supabaseServer();
  const { data: s } = await sb.from("signalement").select("*").eq("id", id).maybeSingle();
  if (!s) return null;

  const [{ data: photos }, { data: messages }, { data: lot }] = await Promise.all([
    sb.from("signalement_photo").select("chemin").eq("signalement_id", id).order("ordre"),
    sb.from("signalement_message").select("auteur, corps, cree_le").eq("signalement_id", id).order("cree_le"),
    sb.from("lot").select("id, nom, bien_id").eq("id", s.lot_id).maybeSingle(),
  ]);
  const { data: bien } = lot
    ? await sb.from("bien").select("id, nom, ville, proprietaire_id").eq("id", lot.bien_id).maybeSingle()
    : { data: null as null | { id: string; nom: string; ville: string; proprietaire_id: string } };
  const { data: proprietaire } = bien
    ? await sb.from("proprietaire").select("id, nom, email").eq("id", bien.proprietaire_id).maybeSingle()
    : { data: null as null | { id: string; nom: string; email: string } };
  const { data: bail } = s.bail_id
    ? await sb.from("bail").select("locataire_id").eq("id", s.bail_id).maybeSingle()
    : { data: null as null | { locataire_id: string } };
  const { data: locataire } = bail
    ? await sb.from("locataire").select("nom, telephone").eq("id", bail.locataire_id).maybeSingle()
    : { data: null as null | { nom: string; telephone: string | null } };

  return {
    id: s.id,
    titre: s.titre,
    description: s.description,
    urgence: s.urgence ?? "non renseignée",
    statut: s.statut,
    creeLe: s.cree_le,
    resoluLe: s.resolu_le,
    photos: (photos ?? []).map((p) => p.chemin),
    messages: (messages ?? []).map((m) => ({ auteur: m.auteur, corps: m.corps, creeLe: m.cree_le })),
    lotNom: lot?.nom ?? "—",
    bienNom: bien?.nom ?? "—",
    ville: bien?.ville ?? "—",
    bailId: s.bail_id,
    proprietaireId: proprietaire?.id ?? "",
    proprietaireNom: proprietaire?.nom ?? "—",
    proprietaireEmail: proprietaire?.email ?? "—",
    locataireNom: locataire?.nom ?? "—",
    locataireTelephone: locataire?.telephone ?? "—",
  };
}

/**
 * Acte de modération sur un signalement : statut (transitions ci-dessus) ou
 * urgence. Mêmes horodatages que le parcours propriétaire (`resolu_le` posé
 * à la résolution, `confirme_le` réinitialisé), et chaque acte est journalisé
 * avec son auteur — modérer le dossier d'autrui sans trace est exclu.
 */
export async function modererSignalement(
  signalementId: string,
  changement: { statut?: StatutSignalement; urgence?: UrgenceSignalement },
  acteurEmail: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const sb = supabaseServer();
  const { data: s } = await sb
    .from("signalement")
    .select("id, statut, urgence, lot_id, resolu_le")
    .eq("id", signalementId)
    .maybeSingle();
  if (!s) return { ok: false, erreur: "Signalement introuvable." };

  const patch: { statut?: string; urgence?: string; resolu_le?: string | null; confirme_le?: null } = {};
  const resumes: string[] = [];

  if (changement.statut && changement.statut !== s.statut) {
    const autorises = TRANSITIONS_MODERATION[s.statut] ?? [];
    if (!autorises.includes(changement.statut)) {
      return { ok: false, erreur: "Transition de statut interdite." };
    }
    patch.statut = changement.statut;
    patch.resolu_le = changement.statut === "resolu" ? new Date().toISOString() : s.resolu_le;
    patch.confirme_le = null;
    resumes.push(`statut ${s.statut} → ${changement.statut}`);
  }

  if (changement.urgence && changement.urgence !== s.urgence) {
    if (!URGENCES.includes(changement.urgence)) return { ok: false, erreur: "Urgence invalide." };
    patch.urgence = changement.urgence;
    resumes.push(`urgence ${s.urgence ?? "—"} → ${changement.urgence}`);
  }

  if (!resumes.length) return { ok: false, erreur: "Rien à changer." };

  const { data: lot } = await sb.from("lot").select("bien_id").eq("id", s.lot_id).maybeSingle();
  const { data: bien } = lot
    ? await sb.from("bien").select("proprietaire_id").eq("id", lot.bien_id).maybeSingle()
    : { data: null as null | { proprietaire_id: string } };

  const { error } = await sb.from("signalement").update(patch).eq("id", signalementId);
  if (error) return { ok: false, erreur: "Mise à jour impossible." };

  await journaliserGesteAdmin(
    bien?.proprietaire_id ?? null,
    acteurEmail,
    resumes.some((r) => r.startsWith("statut")) ? "moderation_statut" : "moderation_urgence",
    `Signalement « ${s.id.slice(0, 8)}… » : ${resumes.join(", ")}`,
  );
  return { ok: true };
}

/* --------------------------------------------------------------- recherche */

/**
 * Recherche support : un nom, un e-mail, un bout de référence ou de titre —
 * et on tombe sur le compte, le bien ou le dossier. Plafonds bas, il s'agit
 * de retrouver, pas d'exporter.
 */
export async function getAdminRecherche(q: string): Promise<AdminRecherche> {
  const sb = supabaseServer();
  // Sans les caractères qui casseraient la syntaxe `or=` de PostgREST : une
  // recherche ne doit jamais devenir une erreur 400.
  const terme = q.trim().replace(/[,()]/g, "").slice(0, 60);
  if (terme.length < 2) return { comptes: [], biens: [], signalements: [] };
  const motif = `%${terme}%`;

  const [{ data: comptes }, { data: biens }, { data: signalements }, { data: proprietaires }] =
    await Promise.all([
      sb.from("proprietaire").select("id, nom, email").or(`nom.ilike.${motif},email.ilike.${motif}`).is("supprime_le", null).limit(10),
      sb.from("bien").select("id, nom, ville, proprietaire_id").or(`nom.ilike.${motif},ville.ilike.${motif}`).limit(10),
      sb.from("signalement").select("id, titre, statut, urgence").ilike("titre", motif).order("cree_le", { ascending: false }).limit(10),
      sb.from("proprietaire").select("id, email").is("supprime_le", null).limit(2000),
    ]);
  const emailParId = new Map((proprietaires ?? []).map((p) => [p.id, p.email]));

  return {
    comptes: (comptes ?? []).map((c) => ({ id: c.id, nom: c.nom, email: c.email })),
    biens: (biens ?? []).map((b) => ({
      id: b.id,
      nom: b.nom,
      ville: b.ville,
      proprietaireId: b.proprietaire_id,
      proprietaireEmail: emailParId.get(b.proprietaire_id) ?? "—",
    })),
    signalements: (signalements ?? []).map((s) => ({
      id: s.id,
      titre: s.titre,
      statut: s.statut,
      urgence: s.urgence ?? "non renseignée",
    })),
  };
}

/* ----------------------------------------------------------------- dossier */

/**
 * Dossier documentaire d'un propriétaire : un dossier par bien, un
 * sous-dossier par lot — photo du bien, photos des pannes signalées, avatar
 * du locataire en place. Tout ce que le parc montre comme image, réuni pour
 * modérer d'un seul écran.
 */
export async function getAdminDossier(proprietaireId: string): Promise<AdminDossier | null> {
  const sb = supabaseServer();
  const { data: proprietaire } = await sb
    .from("proprietaire")
    .select("id")
    .eq("id", proprietaireId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!proprietaire) return null;

  const { data: biens } = await sb
    .from("bien")
    .select("id, nom, ville, image_url")
    .eq("proprietaire_id", proprietaireId)
    .order("cree_le")
    .limit(200);
  if (!biens?.length) return { biens: [], totalPhotos: 0 };

  const bienIds = biens.map((b) => b.id);
  const { data: lots } = await sb.from("lot").select("id, bien_id, nom").in("bien_id", bienIds).limit(1000);
  const lotIds = (lots ?? []).map((l) => l.id);

  const [{ data: signalements }, { data: baux }, { data: locataires }] = await Promise.all([
    lotIds.length
      ? sb.from("signalement").select("id, lot_id, titre, cree_le").in("lot_id", lotIds).limit(500)
      : Promise.resolve({ data: [] as { id: string; lot_id: string; titre: string; cree_le: string }[] }),
    lotIds.length
      ? sb.from("bail").select("id, lot_id, locataire_id, statut").in("lot_id", lotIds).eq("statut", "actif").limit(1000)
      : Promise.resolve({ data: [] as { id: string; lot_id: string; locataire_id: string; statut: string }[] }),
    sb.from("locataire").select("id, nom, photo_url").eq("proprietaire_id", proprietaireId).limit(1000),
  ]);
  const signalementIds = (signalements ?? []).map((s) => s.id);
  const photos: { signalement_id: string; chemin: string }[] = signalementIds.length
    ? (
        await sb
          .from("signalement_photo")
          .select("signalement_id, chemin")
          .in("signalement_id", signalementIds)
          .order("ordre")
          .limit(1000)
      ).data ?? []
    : [];

  const photosParSignalement = new Map<string, string[]>();
  for (const p of photos ?? []) {
    const liste = photosParSignalement.get(p.signalement_id) ?? [];
    liste.push(p.chemin);
    photosParSignalement.set(p.signalement_id, liste);
  }
  const signalementsParLot = new Map<string, { id: string; titre: string; cree_le: string }[]>();
  for (const s of signalements ?? []) {
    const liste = signalementsParLot.get(s.lot_id) ?? [];
    liste.push(s);
    signalementsParLot.set(s.lot_id, liste);
  }
  const bailActifParLot = new Map((baux ?? []).map((b) => [b.lot_id, b]));
  const locataireParId = new Map((locataires ?? []).map((l) => [l.id, l]));

  let totalPhotos = 0;
  const dossier = biens.map((b) => ({
    id: b.id,
    nom: b.nom,
    ville: b.ville,
    imageUrl: b.image_url,
    lots: (lots ?? [])
      .filter((l) => l.bien_id === b.id)
      .map((l) => {
        const photosLot = (signalementsParLot.get(l.id) ?? []).flatMap((s) =>
          (photosParSignalement.get(s.id) ?? []).map((url) => ({ url, titre: s.titre, date: s.cree_le })),
        );
        totalPhotos += photosLot.length;
        const bail = bailActifParLot.get(l.id);
        const locataire = bail ? locataireParId.get(bail.locataire_id) : undefined;
        return {
          id: l.id,
          nom: l.nom,
          photos: photosLot,
          locataireNom: locataire?.nom ?? null,
          locatairePhotoUrl: locataire?.photo_url ?? null,
        };
      }),
  }));

  return { biens: dossier, totalPhotos };
}

/* ------------------------------------------------------------------ systeme */

/** L'état de la plateforme : base, opérateur de paiement, déploiement. */
export async function getAdminSysteme(): Promise<AdminSysteme> {
  const sb = supabaseServer();

  const debut = Date.now();
  const [{ count: nbComptes }, { count: nbAbonnements }, ping, diagnostic] = await Promise.all([
    sb.from("proprietaire").select("id", { count: "exact", head: true }).is("supprime_le", null),
    sb.from("abonnement").select("id", { count: "exact", head: true }),
    sb
      .from("plan")
      .select("id", { count: "exact", head: true })
      .then(
        () => Date.now() - debut,
        () => -1,
      ),
    diagnostiquerConfiguration(),
  ]);

  return {
    supabaseLatenceMs: ping >= 0 ? ping : null,
    comptes: nbComptes ?? 0,
    abonnements: nbAbonnements ?? 0,
    geniuspayDiagnostic: diagnostic,
    geniuspayBacASable: geniuspayBacASable(),
    deploiement: {
      // Posés par Vercel ; absents sur le VPS, où le hash git fait foi.
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "serveur",
      environnement: process.env.VERCEL_ENV ?? "vps",
      hoteAdmin: process.env.ADMIN_HOST?.trim() ? "configuré" : "non configuré",
    },
  };
}
