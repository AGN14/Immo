/**
 * Couche d'accès aux données — branchée sur la base locale Supabase.
 *
 * Même contrat que l'ancien annuaire de démonstration : aucune lecture sans
 * identifiant — `proprietaireId` côté bailleur, `locataireId` côté locataire —
 * et tout passe par la clé de service, qui contourne RLS. Le cloisonnement
 * effectif est porté par les filtres de ces fonctions, pas par la base.
 *
 * Chaque fonction est asynchrone : la base est lointaine, même en local.
 */

import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types.generated";
import { periodeDe, moisSuivant, statutDuMois } from "@/lib/echeances";
import type {
  Bail,
  Bien,
  CompositionLot,
  Locataire,
  PieceIdentite,
  Lot,
  MethodePaiement,
  Paiement,
  Proprietaire,
  Quittance,
  Signalement,
  StatutBail,
  StatutLoyer,
  StatutSignalement,
  StatutVersement,
  TypeBien,
  UrgenceSignalement,
  Versement,
} from "@/lib/types";
import type { PlanId } from "@/lib/plans";

type LigneProprietaire = Database["public"]["Tables"]["proprietaire"]["Row"];
type LigneBien = Database["public"]["Tables"]["bien"]["Row"];
type LigneLot = Database["public"]["Tables"]["lot"]["Row"];
type LigneLocataire = Database["public"]["Tables"]["locataire"]["Row"];
type LigneBail = Database["public"]["Tables"]["bail"]["Row"];
type LigneVersement = Database["public"]["Tables"]["versement"]["Row"];
type LignePaiement = Database["public"]["Tables"]["paiement"]["Row"];
type LigneQuittance = Database["public"]["Tables"]["quittance"]["Row"];
type LigneSignalement = Database["public"]["Tables"]["signalement"]["Row"];

/* ------------------------------------------------------------- mappeurs */

function mappeProprietaire(l: LigneProprietaire): Proprietaire {
  return {
    id: l.id,
    nom: l.nom,
    email: l.email,
    plan: l.plan_id as PlanId,
    jourEcheanceDefaut: l.jour_echeance_defaut,
    jourReversement: l.jour_reversement,
    creeLe: l.cree_le,
    aMotDePasse: l.mot_de_passe_hash !== null,
  };
}

function mappeBien(l: LigneBien): Bien {
  return {
    id: l.id,
    proprietaireId: l.proprietaire_id,
    nom: l.nom,
    type: l.type as TypeBien,
    adresse: l.adresse,
    quartier: l.quartier,
    ville: l.ville,
    dateAjout: l.cree_le,
    description: l.description,
    imageUrl: l.image_url,
    garage: l.garage,
    balcon: l.balcon,
    ascenseur: l.ascenseur,
    climatisation: l.climatisation,
    superficieM2: l.superficie_m2,
    etages: l.etages,
  };
}

function mappeLot(l: LigneLot): Lot {
  return {
    id: l.id,
    bienId: l.bien_id,
    nom: l.nom,
    composition: l.composition as CompositionLot,
    loyerReferenceFcfa: l.loyer_reference_fcfa ?? undefined,
  };
}

function mappeLocataire(l: LigneLocataire): Locataire {
  return {
    id: l.id,
    proprietaireId: l.proprietaire_id,
    nom: l.nom,
    telephone: l.telephone ?? "",
    email: l.email ?? "",
    photoUrl: l.photo_url,
    dateNaissance: l.date_naissance,
    pieceType: (l.piece_type as PieceIdentite | null) ?? null,
    pieceNumero: l.piece_numero,
    profession: l.profession,
    occupants: l.occupants,
    garantNom: l.garant_nom,
    garantTelephone: l.garant_telephone,
  };
}

function mappeBail(l: LigneBail): Bail {
  return {
    id: l.id,
    lotId: l.lot_id,
    locataireId: l.locataire_id,
    loyerMensuelFcfa: l.loyer_mensuel_fcfa,
    dateDebut: l.date_debut,
    dateFin: l.date_fin ?? undefined,
    statut: l.statut as StatutBail,
    jourEcheance: l.jour_echeance ?? undefined,
  };
}

function mappeVersement(l: LigneVersement): Versement {
  return {
    id: l.id,
    bailId: l.bail_id,
    montantTotalFcfa: l.montant_total_fcfa,
    methode: l.methode as MethodePaiement,
    referenceExterne: l.reference_externe ?? undefined,
    statut: l.statut as StatutVersement,
    confirmePar: l.confirme_par ? (l.confirme_par as Versement["confirmePar"]) : undefined,
    declareLe: l.declare_le,
    confirmeLe: l.confirme_le ?? undefined,
  };
}

function mappePaiement(l: LignePaiement): Paiement {
  return {
    id: l.id,
    bailId: l.bail_id,
    versementId: l.versement_id,
    periode: l.periode,
    montantFcfa: l.montant_fcfa,
  };
}

function mappeQuittance(l: LigneQuittance): Quittance {
  return {
    id: l.id,
    paiementId: l.paiement_id,
    proprietaireId: l.proprietaire_id,
    numero: l.numero,
    emiseLe: l.emise_le,
    annuleeLe: l.annulee_le ?? undefined,
  };
}

function mappeSignalement(l: LigneSignalement): Signalement {
  return {
    id: l.id,
    lotId: l.lot_id,
    bailId: l.bail_id ?? undefined,
    titre: l.titre,
    description: l.description,
    urgence: l.urgence as UrgenceSignalement,
    statut: l.statut as StatutSignalement,
    creeLe: l.cree_le,
    resoluLe: l.resolu_le ?? undefined,
    confirmeLe: l.confirme_le ?? undefined,
  };
}

/* ------------------------------------------------------- lectures brutes */

/** La période courante suit le calendrier : pas de constante à mettre à jour. */
export function periodeCourante() {
  return periodeDe(new Date());
}

/* ---------------------------------------------------------- propriétaires */

export async function getProprietaireById(id: string): Promise<Proprietaire | undefined> {
  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("*")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();
  return data ? mappeProprietaire(data) : undefined;
}

export async function getProprietaireByEmail(email: string): Promise<Proprietaire | undefined> {
  const { data } = await supabaseServer()
    .from("proprietaire")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .is("supprime_le", null)
    .maybeSingle();
  return data ? mappeProprietaire(data) : undefined;
}

/**
 * Seules lectures volontairement non cloisonnées : à la connexion, on ne sait
 * pas encore de quel parc relève l'e-mail saisi. Réservées à l'authentification.
 */
export async function getLocataireByEmail(email: string): Promise<Locataire | undefined> {
  const { data } = await supabaseServer()
    .from("locataire")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data ? mappeLocataire(data) : undefined;
}

/* --------------------------------------------- périmètre du propriétaire */

async function perimetre(proprietaireId: string) {
  const sb = supabaseServer();

  const { data: biens } = await sb
    .from("bien")
    .select("*")
    .eq("proprietaire_id", proprietaireId);
  const bienIds = (biens ?? []).map((b) => b.id);

  const { data: lots } = bienIds.length
    ? await sb.from("lot").select("*").in("bien_id", bienIds)
    : { data: [] as LigneLot[] };
  const lotIds = (lots ?? []).map((l) => l.id);

  const { data: baux } = lotIds.length
    ? await sb.from("bail").select("*").in("lot_id", lotIds)
    : { data: [] as LigneBail[] };

  return {
    biens: (biens ?? []).map(mappeBien),
    lots: (lots ?? []).map(mappeLot),
    lotIds: new Set(lotIds),
    baux: (baux ?? []).map(mappeBail),
    bailIds: new Set((baux ?? []).map((b) => b.id)),
  };
}

export async function getBiens(proprietaireId: string): Promise<Bien[]> {
  return (await perimetre(proprietaireId)).biens;
}

export async function getBienById(
  proprietaireId: string,
  id: string,
): Promise<Bien | undefined> {
  return (await perimetre(proprietaireId)).biens.find((b) => b.id === id);
}

export async function getLots(proprietaireId: string): Promise<Lot[]> {
  return (await perimetre(proprietaireId)).lots;
}

export async function getLotById(
  proprietaireId: string,
  id: string,
): Promise<Lot | undefined> {
  return (await perimetre(proprietaireId)).lots.find((l) => l.id === id);
}

export async function getLotsByBienId(proprietaireId: string, bienId: string): Promise<Lot[]> {
  return (await perimetre(proprietaireId)).lots.filter((l) => l.bienId === bienId);
}

export async function getLocataires(proprietaireId: string): Promise<Locataire[]> {
  const { data } = await supabaseServer()
    .from("locataire")
    .select("*")
    .eq("proprietaire_id", proprietaireId);
  return (data ?? []).map(mappeLocataire);
}

export async function getLocataireById(
  proprietaireId: string,
  id: string,
): Promise<Locataire | undefined> {
  const { data } = await supabaseServer()
    .from("locataire")
    .select("*")
    .eq("id", id)
    .eq("proprietaire_id", proprietaireId)
    .maybeSingle();
  return data ? mappeLocataire(data) : undefined;
}

export async function getBaux(proprietaireId: string): Promise<Bail[]> {
  return (await perimetre(proprietaireId)).baux;
}

/** L'unité facturée : ni les biens, ni les lots, ni les locataires. */
export async function getBauxActifs(proprietaireId: string): Promise<Bail[]> {
  return (await getBaux(proprietaireId)).filter((b) => b.statut === "actif");
}

export async function getBauxTermines(proprietaireId: string): Promise<Bail[]> {
  return (await getBaux(proprietaireId)).filter((b) => b.statut === "termine");
}

export async function getBailById(
  proprietaireId: string,
  id: string,
): Promise<Bail | undefined> {
  return (await perimetre(proprietaireId)).baux.find((b) => b.id === id);
}

export async function getBailActifByLotId(
  proprietaireId: string,
  lotId: string,
): Promise<Bail | undefined> {
  return (await perimetre(proprietaireId)).baux.find(
    (b) => b.lotId === lotId && b.statut === "actif",
  );
}

export async function getBauxByLotId(proprietaireId: string, lotId: string): Promise<Bail[]> {
  return (await perimetre(proprietaireId))
    .baux.filter((b) => b.lotId === lotId)
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

/* ------------------------------------------ versements et paiements (bailleur) */

async function versementsDeBaux(bailIds: Set<string>): Promise<Versement[]> {
  const ids = [...bailIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer().from("versement").select("*").in("bail_id", ids);
  return (data ?? []).map(mappeVersement);
}

async function paiementsDeBaux(bailIds: Set<string>): Promise<Paiement[]> {
  const ids = [...bailIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer().from("paiement").select("*").in("bail_id", ids);
  return (data ?? []).map(mappePaiement);
}

export async function getVersements(proprietaireId: string): Promise<Versement[]> {
  const { bailIds } = await perimetre(proprietaireId);
  return (await versementsDeBaux(bailIds)).sort((a, b) =>
    b.declareLe.localeCompare(a.declareLe),
  );
}

/** Les déclarations que le propriétaire doit encore pointer. */
export async function getVersementsAConfirmer(proprietaireId: string): Promise<Versement[]> {
  return (await getVersements(proprietaireId)).filter((v) => v.statut === "initie");
}

export async function getPaiements(proprietaireId: string): Promise<Paiement[]> {
  const { bailIds } = await perimetre(proprietaireId);
  return paiementsDeBaux(bailIds);
}

export async function getPaiementsByBailId(
  proprietaireId: string,
  bailId: string,
): Promise<Paiement[]> {
  const { bailIds } = await perimetre(proprietaireId);
  if (!bailIds.has(bailId)) return [];
  return (await paiementsDeBaux(bailIds))
    .filter((p) => p.bailId === bailId)
    .sort((a, b) => b.periode.localeCompare(a.periode));
}

export async function getPaiementsPeriodeCourante(proprietaireId: string): Promise<Paiement[]> {
  const periode = periodeCourante();
  return (await getPaiements(proprietaireId)).filter((p) => p.periode === periode);
}

export async function getVersementById(
  proprietaireId: string,
  id: string,
): Promise<Versement | undefined> {
  return (await getVersements(proprietaireId)).find((v) => v.id === id);
}

/** Le versement d'un paiement — porte la méthode, la référence et le statut. */
export async function versementDuPaiement(
  versementId: string,
): Promise<Versement | undefined> {
  const { data } = await supabaseServer()
    .from("versement")
    .select("*")
    .eq("id", versementId)
    .maybeSingle();
  return data ? mappeVersement(data) : undefined;
}

export async function getQuittanceDuPaiement(
  paiementId: string,
): Promise<Quittance | undefined> {
  const { data } = await supabaseServer()
    .from("quittance")
    .select("*")
    .eq("paiement_id", paiementId)
    .is("annulee_le", null)
    .maybeSingle();
  return data ? mappeQuittance(data) : undefined;
}

/* --------------------------------------------------- statut d'un mois */

export async function statutLoyerDuBail(
  proprietaireId: string,
  bailId: string,
): Promise<StatutLoyer> {
  const [perimetreDuParc, proprietaire] = await Promise.all([
    perimetre(proprietaireId),
    getProprietaireById(proprietaireId),
  ]);
  const bail = perimetreDuParc.baux.find((b) => b.id === bailId);
  if (!bail || !proprietaire) return "en-attente";
  const [paiements, versements] = await Promise.all([
    paiementsDeBaux(perimetreDuParc.bailIds),
    versementsDeBaux(perimetreDuParc.bailIds),
  ]);
  return statutDuMois(periodeCourante(), bail, proprietaire, paiements, versements);
}

/* -------------------------------------------------------- signalements */

export async function getSignalements(proprietaireId: string): Promise<Signalement[]> {
  const { lotIds } = await perimetre(proprietaireId);
  const ids = [...lotIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer().from("signalement").select("*").in("lot_id", ids);
  return (data ?? [])
    .map(mappeSignalement)
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

export async function getSignalementsOuverts(proprietaireId: string): Promise<Signalement[]> {
  return (await getSignalements(proprietaireId)).filter(
    (s) => s.statut === "signale" || s.statut === "pris-en-charge",
  );
}

/** Les photos d'une série de signalements, indexées par identifiant. */
export async function getPhotosDeSignalements(
  signalementIds: string[],
): Promise<Record<string, string[]>> {
  const ids = [...new Set(signalementIds)];
  if (!ids.length) return {};
  const { data } = await supabaseServer()
    .from("signalement_photo")
    .select("signalement_id, chemin")
    .in("signalement_id", ids)
    .order("ordre", { ascending: true });
  const photos: Record<string, string[]> = {};
  for (const p of data ?? []) (photos[p.signalement_id] ??= []).push(p.chemin);
  return photos;
}

export async function getSignalementsByLotId(
  proprietaireId: string,
  lotId: string,
): Promise<Signalement[]> {
  return (await getSignalements(proprietaireId)).filter((s) => s.lotId === lotId);
}

/* ============================================ périmètre du locataire ==== */

/**
 * Pendant exact du périmètre propriétaire. Un locataire ne voit que ses propres
 * baux, et rien d'autre — même en tapant une URL à la main.
 */
async function perimetreLocataire(locataireId: string) {
  const { data } = await supabaseServer()
    .from("bail")
    .select("*")
    .eq("locataire_id", locataireId);
  const baux = (data ?? []).map(mappeBail);
  return { baux, bailIds: new Set(baux.map((b) => b.id)) };
}

export async function getLocataireParId(locataireId: string): Promise<Locataire | undefined> {
  const { data } = await supabaseServer()
    .from("locataire")
    .select("*")
    .eq("id", locataireId)
    .maybeSingle();
  return data ? mappeLocataire(data) : undefined;
}

/** Le bail en cours du locataire. Absent s'il est sorti. */
export async function getBailDuLocataire(locataireId: string): Promise<Bail | undefined> {
  return (await perimetreLocataire(locataireId)).baux.find((b) => b.statut === "actif");
}

export async function getBauxDuLocataire(locataireId: string): Promise<Bail[]> {
  return (await perimetreLocataire(locataireId)).baux.sort((a, b) =>
    b.dateDebut.localeCompare(a.dateDebut),
  );
}

/** Le logement occupé, avec son bien — sans jamais exposer le reste du parc. */
export async function getLogementDuLocataire(locataireId: string) {
  const bail = await getBailDuLocataire(locataireId);
  if (!bail) return undefined;

  // Résolution en deux temps : lot → bien → propriétaire.
  const sb = supabaseServer();
  const { data: lot } = await sb.from("lot").select("*").eq("id", bail.lotId).maybeSingle();
  if (!lot) return { bail, lot: undefined, bien: undefined, proprietaire: undefined };

  const { data: bien } = await sb
    .from("bien")
    .select("*")
    .eq("id", lot.bien_id)
    .maybeSingle();
  const proprietaire = bien
    ? await getProprietaireById(bien.proprietaire_id)
    : undefined;

  return {
    bail,
    lot: mappeLot(lot),
    bien: bien ? mappeBien(bien) : undefined,
    proprietaire,
  };
}

export async function getPaiementsDuLocataire(locataireId: string): Promise<Paiement[]> {
  const { bailIds } = await perimetreLocataire(locataireId);
  return (await paiementsDeBaux(bailIds)).sort((a, b) => b.periode.localeCompare(a.periode));
}

export async function getVersementsDuLocataire(locataireId: string): Promise<Versement[]> {
  const { bailIds } = await perimetreLocataire(locataireId);
  return (await versementsDeBaux(bailIds)).sort((a, b) =>
    b.declareLe.localeCompare(a.declareLe),
  );
}

export async function getQuittancesDuLocataire(locataireId: string): Promise<Quittance[]> {
  const paiements = await getPaiementsDuLocataire(locataireId);
  const paiementIds = paiements.map((p) => p.id);
  if (!paiementIds.length) return [];
  const { data } = await supabaseServer()
    .from("quittance")
    .select("*")
    .in("paiement_id", paiementIds)
    .is("annulee_le", null);
  return (data ?? []).map(mappeQuittance);
}

export async function getSignalementsDuLocataire(locataireId: string): Promise<Signalement[]> {
  const { bailIds } = await perimetreLocataire(locataireId);
  const ids = [...bailIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer()
    .from("signalement")
    .select("*")
    .in("bail_id", ids);
  return (data ?? [])
    .map(mappeSignalement)
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

/* --------------------------------------------------------------- dashboard */

/**
 * L'historique de trésorerie des N derniers mois, pour le graphique de la vue
 * d'ensemble : ce qui a été encaissé (versements confirmés) face à ce qui
 * était attendu (baux actifs sur la période).
 */
export async function getSerieLoyers(
  proprietaireId: string,
  nbMois = 6,
): Promise<{ periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[]> {
  const [fin, baux, paiements, versements] = await Promise.all([
    periodeCourante(),
    getBaux(proprietaireId),
    getPaiements(proprietaireId),
    getVersements(proprietaireId),
  ]);

  let debut = fin;
  for (let i = 1; i < nbMois; i++) debut = moisSuivant(debut, -1);

  const versementConfirme = new Set(
    versements.filter((v) => v.statut === "confirme").map((v) => v.id),
  );

  const serie: { periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[] = [];
  let mois = debut;
  while (mois <= fin) {
    const [annee, numMois] = mois.split("-").map(Number);
    const finMois = new Date(annee, numMois, 0);
    const debutMois = new Date(annee, numMois - 1, 1);

    const encaisseFcfa = paiements
      .filter((p) => p.periode === mois && versementConfirme.has(p.versementId))
      .reduce((sum, p) => sum + p.montantFcfa, 0);

    // Un bail ne pèse que s'il était actif pendant ce mois-là.
    const attenduFcfa = baux
      .filter(
        (b) =>
          new Date(b.dateDebut) <= finMois &&
          (!b.dateFin || new Date(b.dateFin) >= debutMois),
      )
      .reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);

    serie.push({
      periode: mois,
      label: debutMois.toLocaleDateString("fr-FR", { month: "short" }),
      encaisseFcfa,
      attenduFcfa,
    });
    mois = moisSuivant(mois);
  }
  return serie;
}

/** Les lots libres de tout bail actif — candidats pour une nouvelle location. */
export async function getLotsDisponibles(proprietaireId: string) {
  const [{ biens, lots }, baux] = await Promise.all([
    perimetre(proprietaireId),
    getBaux(proprietaireId),
  ]);
  const lotsOccupees = new Set(
    baux.filter((b) => b.statut === "actif").map((b) => b.lotId),
  );
  const bienParId = new Map(biens.map((b) => [b.id, b]));
  return lots
    .filter((l) => !lotsOccupees.has(l.id))
    .map((l) => ({ lot: l, bien: bienParId.get(l.bienId) }));
}

export async function getDashboardKpis(proprietaireId: string) {
  const [{ biens, lots, bailIds }, bauxActifs] = await Promise.all([
    perimetre(proprietaireId),
    getBauxActifs(proprietaireId),
  ]);

  const [paiementsMois, versements] = await Promise.all([
    getPaiementsPeriodeCourante(proprietaireId),
    versementsDeBaux(bailIds),
  ]);

  const confirme = (versementId: string) =>
    versements.find((v) => v.id === versementId)?.statut === "confirme";

  const totalRecuFcfa = paiementsMois
    .filter((p) => confirme(p.versementId))
    .reduce((sum, p) => sum + p.montantFcfa, 0);

  const attendu = bauxActifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const signalementsOuverts = (await getSignalementsOuverts(proprietaireId)).length;

  return {
    totalRecuFcfa,
    totalEnAttenteFcfa: Math.max(0, attendu - totalRecuFcfa),
    lotsLoues: bauxActifs.length,
    lotsTotal: lots.length,
    tauxOccupation: lots.length ? Math.round((bauxActifs.length / lots.length) * 100) : 0,
    biensTotal: biens.length,
    signalementsOuverts,
  };
}
