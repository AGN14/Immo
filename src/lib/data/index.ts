/**
 * Couche d'accÃ¨s aux donnÃ©es â€” branchÃ©e sur la base locale Supabase.
 *
 * MÃªme contrat que l'ancien annuaire de dÃ©monstration : aucune lecture sans
 * identifiant â€” `proprietaireId` cÃ´tÃ© bailleur, `locataireId` cÃ´tÃ© locataire â€”
 * et tout passe par la clÃ© de service, qui contourne RLS. Le cloisonnement
 * effectif est portÃ© par les filtres de ces fonctions, pas par la base.
 *
 * Chaque fonction est asynchrone : la base est lointaine, mÃªme en local.
 */

import "server-only";
import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types.generated";
import { periodeDe, moisSuivant, statutDuMois } from "@/lib/echeances";
import type {
  Bail,
  Bien,
  Caution,
  CompositionLot,
  Gestionnaire,
  Locataire,
  PieceIdentite,
  Lot,
  MethodePaiement,
  Paiement,
  Proprietaire,
  Quittance,
  Signalement,
  StatutBail,
  StatutCaution,
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
    penaliteRetardFcfa: l.penalite_retard_fcfa,
    delaiToleranceJours: l.delai_tolerance_jours,
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
    code: l.code,
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
    penalitesFcfa: l.penalites_fcfa,
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
    penaliteFcfa: l.penalite_fcfa,
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

/** La pÃ©riode courante suit le calendrier : pas de constante Ã  mettre Ã  jour. */
export function periodeCourante() {
  return periodeDe(new Date());
}

/* ---------------------------------------------------------- propriÃ©taires */

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
 * Seules lectures volontairement non cloisonnÃ©es : Ã  la connexion, on ne sait
 * pas encore de quel parc relÃ¨ve l'e-mail saisi. RÃ©servÃ©es Ã  l'authentification.
 */
export async function getLocataireByEmail(email: string): Promise<Locataire | undefined> {
  const { data } = await supabaseServer()
    .from("locataire")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data ? mappeLocataire(data) : undefined;
}

/* --------------------------------------------- pÃ©rimÃ¨tre du propriÃ©taire */

/**
 * Le parc complet d'un propriÃ©taire : biens, lots et baux.
 *
 * Deux optimisations tiennent ensemble ici, et elles comptent : la base est au
 * bout du rÃ©seau, donc c'est le **nombre d'allers-retours** qui fait le temps
 * de rÃ©ponse, pas le volume de donnÃ©es.
 *
 * 1. Une seule requÃªte au lieu de trois. Les lots et les baux sont imbriquÃ©s
 *    via les clÃ©s Ã©trangÃ¨res plutÃ´t que chaÃ®nÃ©s â€” la version sÃ©quentielle
 *    devait attendre les identifiants de l'Ã©tage prÃ©cÃ©dent Ã  chaque niveau.
 *
 * 2. `cache()` mÃ©morise le rÃ©sultat **pour la durÃ©e d'un rendu**. Une page qui
 *    demande les biens, les lots, les baux et les versements appelait cette
 *    fonction cinq fois ; elle ne l'exÃ©cute plus qu'une. Le cache ne survit pas
 *    Ã  la requÃªte HTTP : aucune donnÃ©e pÃ©rimÃ©e d'un rendu Ã  l'autre.
 */
const perimetre = cache(async (proprietaireId: string) => {
  const { data } = await supabaseServer()
    .from("bien")
    .select("*, lot(*, bail(*))")
    .eq("proprietaire_id", proprietaireId);

  const biens: Bien[] = [];
  const lots: Lot[] = [];
  const lotIds = new Set<string>();
  const baux: Bail[] = [];
  const bailIds = new Set<string>();

  for (const ligne of data ?? []) {
    const { lot: sesLots, ...bien } = ligne;
    biens.push(mappeBien(bien as LigneBien));

    for (const ligneLot of sesLots ?? []) {
      const { bail: sesBaux, ...lot } = ligneLot;
      lots.push(mappeLot(lot as LigneLot));
      lotIds.add(lot.id);

      for (const bail of sesBaux ?? []) {
        baux.push(mappeBail(bail as LigneBail));
        bailIds.add(bail.id);
      }
    }
  }

  return { biens, lots, lotIds, baux, bailIds };
});

export async function getBiens(proprietaireId: string): Promise<Bien[]> {
  return (await perimetre(proprietaireId)).biens;
}

export async function getBienById(proprietaireId: string, id: string): Promise<Bien | undefined> {
  return (await perimetre(proprietaireId)).biens.find((b) => b.id === id);
}

export async function getLots(proprietaireId: string): Promise<Lot[]> {
  return (await perimetre(proprietaireId)).lots;
}

export async function getLotById(proprietaireId: string, id: string): Promise<Lot | undefined> {
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

/** L'unitÃ© facturÃ©e : ni les biens, ni les lots, ni les locataires. */
export async function getBauxActifs(proprietaireId: string): Promise<Bail[]> {
  return (await getBaux(proprietaireId)).filter((b) => b.statut === "actif");
}

export async function getBauxTermines(proprietaireId: string): Promise<Bail[]> {
  return (await getBaux(proprietaireId)).filter((b) => b.statut === "termine");
}

export async function getBailById(proprietaireId: string, id: string): Promise<Bail | undefined> {
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
  return (await perimetre(proprietaireId)).baux
    .filter((b) => b.lotId === lotId)
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
}

/* ------------------------------------------ versements et paiements (bailleur) */

/**
 * MÃ©morisÃ©s eux aussi : `perimetre` Ã©tant en cache, il rend le **mÃªme** objet
 * `bailIds` d'un appel Ã  l'autre, et `cache()` compare ses arguments par
 * rÃ©fÃ©rence â€” les deux se combinent donc naturellement.
 *
 * Les tableaux rendus sont partagÃ©s entre appelants : ne jamais les trier ni
 * les modifier sur place. Chaque fonction publique en tire une copie.
 */
const versementsDeBaux = cache(async (bailIds: Set<string>): Promise<Versement[]> => {
  const ids = [...bailIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer().from("versement").select("*").in("bail_id", ids);
  return (data ?? []).map(mappeVersement);
});

const paiementsDeBaux = cache(async (bailIds: Set<string>): Promise<Paiement[]> => {
  const ids = [...bailIds];
  if (!ids.length) return [];
  const { data } = await supabaseServer().from("paiement").select("*").in("bail_id", ids);
  return (data ?? []).map(mappePaiement);
});

export async function getVersements(proprietaireId: string): Promise<Versement[]> {
  const { bailIds } = await perimetre(proprietaireId);
  return [...(await versementsDeBaux(bailIds))].sort((a, b) =>
    b.declareLe.localeCompare(a.declareLe),
  );
}

/** Les dÃ©clarations que le propriÃ©taire doit encore pointer. */
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

/** Le versement d'un paiement â€” porte la mÃ©thode, la rÃ©fÃ©rence et le statut. */
export async function versementDuPaiement(versementId: string): Promise<Versement | undefined> {
  const { data } = await supabaseServer()
    .from("versement")
    .select("*")
    .eq("id", versementId)
    .maybeSingle();
  return data ? mappeVersement(data) : undefined;
}

/**
 * Les quittances de plusieurs paiements, en une seule requÃªte.
 *
 * La variante unitaire ci-dessous, appelÃ©e dans une boucle sur les lignes d'un
 * tableau, produisait un aller-retour rÃ©seau par mois affichÃ©. PrÃ©fÃ©rez celle-ci
 * dÃ¨s que vous en attendez plus d'une.
 */
export async function getQuittancesDesPaiements(
  paiementIds: string[],
): Promise<Map<string, Quittance>> {
  if (!paiementIds.length) return new Map();
  const { data } = await supabaseServer()
    .from("quittance")
    .select("*")
    .in("paiement_id", paiementIds)
    .is("annulee_le", null);
  return new Map((data ?? []).map((l) => [l.paiement_id, mappeQuittance(l)]));
}

export async function getQuittanceDuPaiement(paiementId: string): Promise<Quittance | undefined> {
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
  return (data ?? []).map(mappeSignalement).sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

export async function getSignalementsOuverts(proprietaireId: string): Promise<Signalement[]> {
  return (await getSignalements(proprietaireId)).filter(
    (s) => s.statut === "signale" || s.statut === "pris-en-charge",
  );
}

/** Les photos d'une sÃ©rie de signalements, indexÃ©es par identifiant. */
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

/* ============================================ pÃ©rimÃ¨tre du locataire ==== */

/**
 * Pendant exact du pÃ©rimÃ¨tre propriÃ©taire. Un locataire ne voit que ses propres
 * baux, et rien d'autre â€” mÃªme en tapant une URL Ã  la main.
 */
const perimetreLocataire = cache(async (locataireId: string) => {
  const { data } = await supabaseServer().from("bail").select("*").eq("locataire_id", locataireId);
  const baux = (data ?? []).map(mappeBail);
  return { baux, bailIds: new Set(baux.map((b) => b.id)) };
});

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
  return [...(await perimetreLocataire(locataireId)).baux].sort((a, b) =>
    b.dateDebut.localeCompare(a.dateDebut),
  );
}

/**
 * Le logement occupÃ©, avec son bien â€” sans jamais exposer le reste du parc.
 *
 * La remontÃ©e lot â†’ bien â†’ propriÃ©taire se fait en **une** requÃªte imbriquÃ©e.
 * En trois requÃªtes chaÃ®nÃ©es, chaque Ã©tage attendait l'identifiant du
 * prÃ©cÃ©dent : trois allers-retours rÃ©seau pour trois lignes.
 *
 * MÃ©morisÃ© parce que le tableau de bord et la page de paiement l'appellent
 * tous deux, et que le propriÃ©taire qu'il rend porte le barÃ¨me des pÃ©nalitÃ©s.
 */
export const getLogementDuLocataire = cache(async (locataireId: string) => {
  const bail = await getBailDuLocataire(locataireId);
  if (!bail) return undefined;

  const { data: lot } = await supabaseServer()
    .from("lot")
    .select("*, bien(*, proprietaire(*))")
    .eq("id", bail.lotId)
    .maybeSingle();

  if (!lot) return { bail, lot: undefined, bien: undefined, proprietaire: undefined };

  const { bien: sonBien, ...ligneLot } = lot;
  const { proprietaire: sonProprietaire, ...ligneBien } = sonBien ?? { proprietaire: null };

  return {
    bail,
    lot: mappeLot(ligneLot as LigneLot),
    bien: sonBien ? mappeBien(ligneBien as LigneBien) : undefined,
    proprietaire: sonProprietaire
      ? mappeProprietaire(sonProprietaire as LigneProprietaire)
      : undefined,
  };
});

export async function getPaiementsDuLocataire(locataireId: string): Promise<Paiement[]> {
  const { bailIds } = await perimetreLocataire(locataireId);
  return [...(await paiementsDeBaux(bailIds))].sort((a, b) => b.periode.localeCompare(a.periode));
}

export async function getVersementsDuLocataire(locataireId: string): Promise<Versement[]> {
  const { bailIds } = await perimetreLocataire(locataireId);
  return [...(await versementsDeBaux(bailIds))].sort((a, b) =>
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
  const { data } = await supabaseServer().from("signalement").select("*").in("bail_id", ids);
  return (data ?? []).map(mappeSignalement).sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

/* --------------------------------------------------------------- dashboard */

/**
 * L'historique de trÃ©sorerie des N derniers mois, pour le graphique de la vue
 * d'ensemble : ce qui a Ã©tÃ© encaissÃ© (versements confirmÃ©s) face Ã  ce qui
 * Ã©tait attendu (baux actifs sur la pÃ©riode).
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

    // Un bail ne pÃ¨se que s'il Ã©tait actif pendant ce mois-lÃ .
    const attenduFcfa = baux
      .filter(
        (b) => new Date(b.dateDebut) <= finMois && (!b.dateFin || new Date(b.dateFin) >= debutMois),
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

/** SÃ©rie sur les 12 mois d'une annÃ©e civile donnÃ©e â€” historique antÃ©rieur. */
export async function getSerieLoyersAnnee(
  proprietaireId: string,
  annee: number,
): Promise<{ periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[]> {
  const [baux, paiements, versements] = await Promise.all([
    getBaux(proprietaireId),
    getPaiements(proprietaireId),
    getVersements(proprietaireId),
  ]);

  const versementConfirme = new Set(
    versements.filter((v) => v.statut === "confirme").map((v) => v.id),
  );

  const serie: { periode: string; label: string; encaisseFcfa: number; attenduFcfa: number }[] = [];
  let mois = `${annee}-01`;
  const fin = `${annee}-12`;
  while (mois <= fin) {
    const [a, numMois] = mois.split("-").map(Number);
    const finMois = new Date(a, numMois, 0);
    const debutMois = new Date(a, numMois - 1, 1);

    const encaisseFcfa = paiements
      .filter((p) => p.periode === mois && versementConfirme.has(p.versementId))
      .reduce((sum, p) => sum + p.montantFcfa, 0);

    const attenduFcfa = baux
      .filter(
        (b) => new Date(b.dateDebut) <= finMois && (!b.dateFin || new Date(b.dateFin) >= debutMois),
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

/** Les lots libres de tout bail actif â€” candidats pour une nouvelle location. */
export async function getLotsDisponibles(proprietaireId: string) {
  const [{ biens, lots }, baux] = await Promise.all([
    perimetre(proprietaireId),
    getBaux(proprietaireId),
  ]);
  const lotsOccupees = new Set(baux.filter((b) => b.statut === "actif").map((b) => b.lotId));
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

/** DÃ©pÃ´ts de garantie du parc (plan Business). */
export async function getCautions(proprietaireId: string): Promise<Caution[]> {
  const { bailIds } = await perimetre(proprietaireId);
  const { data } = await supabaseServer()
    .from("caution")
    .select("*")
    .in("bail_id", [...bailIds])
    .order("cree_le", { ascending: false });
  return (data ?? []).map((c) => ({
    id: c.id,
    bailId: c.bail_id,
    montantFcfa: c.montant_fcfa,
    statut: c.statut as StatutCaution,
    encaisseeLe: c.encaissee_le ?? undefined,
    restitueeLe: c.restituee_le ?? undefined,
  }));
}

/** Ã‰quipe de gestion du parc (plan Business). */
export async function getGestionnaires(proprietaireId: string): Promise<Gestionnaire[]> {
  const { data } = await supabaseServer()
    .from("gestionnaire")
    .select("*")
    .eq("proprietaire_id", proprietaireId)
    .order("cree_le", { ascending: false });
  return (data ?? []).map((g) => ({
    id: g.id,
    proprietaireId: g.proprietaire_id,
    nom: g.nom,
    email: g.email ?? undefined,
    telephone: g.telephone ?? undefined,
    creeLe: g.cree_le,
  }));
}
