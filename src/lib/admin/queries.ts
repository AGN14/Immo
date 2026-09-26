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
import type {
  AdminAbonnement,
  AdminCompte,
  AdminCompteDetail,
  AdminOverview,
  AlerteCompte,
  StatutCompte,
} from "@/lib/admin/types";

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
        .select("id, nom, email, cree_le, plan_id, plan_expire_le")
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
      .select("id, nom, email, cree_le, plan_id, plan_expire_le")
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
    .select("id, nom, email, cree_le, plan_id, plan_expire_le")
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
export async function appliquerPlanAdmin(
  proprietaireId: string,
  plan: PlanId,
  joursBruts: unknown,
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
  return { expireLe: expireLe?.toISOString() ?? null };
}

/**
 * Prolonger l'abonnement en cours : la nouvelle fin part du plus tard entre
 * maintenant et l'échéance actuelle — on ne punit pas celui qui prolonge tôt.
 */
export async function prolongerAbonnementAdmin(
  proprietaireId: string,
  joursBruts: unknown,
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
  return { expireLe: fin.toISOString() };
}
