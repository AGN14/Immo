import type { Bail, Paiement, ReglagesEcheance, StatutLoyer, Versement } from "@/lib/types";

/**
 * Calcul des échéances de loyer.
 *
 * Rien n'est stocké : le statut d'un mois se déduit de l'existence d'un
 * paiement, de l'état de son versement et de la date du jour. Un statut
 * « en retard » en base exigerait une tâche nocturne qui se désynchronise au
 * premier incident.
 *
 * Le loyer est payé d'avance : l'échéance de la période 2026-09 tombe le
 * jour d'échéance de septembre 2026.
 */

/** Format « YYYY-MM ». */
export type Periode = string;

export function periodeDe(date: Date): Periode {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function moisSuivant(periode: Periode, pas = 1): Periode {
  const [annee, mois] = periode.split("-").map(Number);
  const d = new Date(annee, mois - 1 + pas, 1);
  return periodeDe(d);
}

/** Le jour d'échéance applicable : celui du bail s'il a été négocié, sinon la
 *  règle du propriétaire. */
export function jourEcheance(bail: Bail, proprietaire: ReglagesEcheance): number {
  return bail.jourEcheance ?? proprietaire.jourEcheanceDefaut;
}

/**
 * La date limite d'une période. Un jour 31 se replie sur le dernier jour des
 * mois courts — sans ça, février n'aurait jamais d'échéance.
 */
export function dateEcheance(periode: Periode, jour: number): Date {
  const [annee, mois] = periode.split("-").map(Number);
  const dernierJour = new Date(annee, mois, 0).getDate();
  return new Date(annee, mois - 1, Math.min(jour, dernierJour), 23, 59, 59);
}

/**
 * Le dernier instant où un mois peut encore être régularisé contre l'amende.
 * Au-delà, le propriétaire est fondé à donner congé.
 *
 * Le délai court **en jours après l'échéance**, pas jusqu'à une date fixe :
 * avec une échéance au 5 et 5 jours de tolérance on obtient bien le 10, et un
 * bail dont l'échéance a été négociée plus tard garde le même délai de grâce.
 */
export function dateLimiteTolerance(
  periode: Periode,
  jour: number,
  delaiToleranceJours: number,
): Date {
  const limite = dateEcheance(periode, jour);
  limite.setDate(limite.getDate() + delaiToleranceJours);
  return limite;
}

/**
 * L'amende encourue pour un mois donné, à la date d'aujourd'hui.
 *
 * Forfaitaire et due dès le premier jour de retard : payer le 6 ou le 10 coûte
 * la même chose. Elle ne s'applique qu'aux mois échus — régler un mois d'avance
 * ne peut évidemment rien coûter.
 */
export function penaliteDuMois(
  periode: Periode,
  bail: Bail,
  proprietaire: ReglagesEcheance,
  aujourdhui = new Date(),
): number {
  const enRetard = aujourdhui > dateEcheance(periode, jourEcheance(bail, proprietaire));
  return enRetard ? proprietaire.penaliteRetardFcfa : 0;
}

/** Toutes les périodes couvertes par un bail, de son début à aujourd'hui (ou à
 *  sa fin s'il est terminé). */
export function periodesDuBail(bail: Bail, aujourdhui = new Date()): Periode[] {
  const debut = periodeDe(new Date(bail.dateDebut));
  const fin = bail.dateFin ? periodeDe(new Date(bail.dateFin)) : periodeDe(aujourdhui);

  const periodes: Periode[] = [];
  let courante = debut;
  // Garde-fou : un bail malformé ne doit pas boucler indéfiniment.
  while (courante <= fin && periodes.length < 600) {
    periodes.push(courante);
    courante = moisSuivant(courante);
  }
  return periodes;
}

/** Un versement compte comme payé s'il est confirmé ; s'il est seulement
 *  déclaré, le mois est en attente de vérification. */
function versementDe(paiement: Paiement, versements: Versement[]) {
  return versements.find((v) => v.id === paiement.versementId);
}

export function statutDuMois(
  periode: Periode,
  bail: Bail,
  proprietaire: ReglagesEcheance,
  paiements: Paiement[],
  versements: Versement[],
  aujourdhui = new Date(),
): StatutLoyer {
  const paiement = paiements.find((p) => p.bailId === bail.id && p.periode === periode);

  if (paiement) {
    const versement = versementDe(paiement, versements);
    if (versement?.statut === "confirme") return "a-jour";
    if (versement?.statut === "initie") return "declare";
  }

  const jour = jourEcheance(bail, proprietaire);

  // Le seuil du préavis se teste en premier : il est plus tardif que l'échéance
  // et doit donc l'emporter sur le simple retard.
  if (aujourdhui > dateLimiteTolerance(periode, jour, proprietaire.delaiToleranceJours)) {
    return "preavis";
  }
  return aujourdhui > dateEcheance(periode, jour) ? "en-retard" : "en-attente";
}

/**
 * Les mois dus et non couverts, du plus ancien au plus récent.
 * Un versement seulement déclaré couvre le mois : on ne demande pas au
 * locataire de payer deux fois pendant que le propriétaire vérifie.
 */
export function moisImpayes(
  bail: Bail,
  paiements: Paiement[],
  versements: Versement[],
  aujourdhui = new Date(),
): Periode[] {
  const couverts = new Set(
    paiements
      .filter((p) => p.bailId === bail.id)
      .filter((p) => {
        const v = versementDe(p, versements);
        return v?.statut === "confirme" || v?.statut === "initie";
      })
      .map((p) => p.periode),
  );

  return periodesDuBail(bail, aujourdhui).filter((p) => !couverts.has(p));
}

/**
 * Les N prochains mois à régler. Le locataire choisit un **nombre de mois**, pas
 * des mois précis : le système part des plus anciens impayés puis avance dans le
 * futur. On évite ainsi de payer décembre en devant septembre.
 */
export function moisAPayer(
  bail: Bail,
  paiements: Paiement[],
  versements: Versement[],
  nombre: number,
  aujourdhui = new Date(),
): Periode[] {
  const impayes = moisImpayes(bail, paiements, versements, aujourdhui);
  const resultat = impayes.slice(0, nombre);

  // Pas assez d'arriérés : on complète par des mois d'avance.
  let suivante = resultat.length
    ? moisSuivant(resultat[resultat.length - 1])
    : periodeDe(aujourdhui);

  const couverts = new Set(paiements.filter((p) => p.bailId === bail.id).map((p) => p.periode));
  while (resultat.length < nombre) {
    if (!couverts.has(suivante)) resultat.push(suivante);
    suivante = moisSuivant(suivante);
  }

  return resultat;
}

/**
 * Ce que le locataire doit à l'instant : les mois échus et non couverts, **et**
 * les amendes qu'ils ont fait courir.
 *
 * Le détail est renvoyé séparément parce qu'il ne se recompose pas : un solde
 * global ne dit pas au locataire pourquoi il doit 30 000 pour un loyer de
 * 25 000, et le propriétaire doit pouvoir distinguer son revenu locatif de ses
 * pénalités.
 */
export function soldeDu(
  bail: Bail,
  proprietaire: ReglagesEcheance,
  paiements: Paiement[],
  versements: Versement[],
  aujourdhui = new Date(),
): {
  mois: Periode[];
  loyerFcfa: number;
  penalitesFcfa: number;
  montantFcfa: number;
  sousPreavis: Periode[];
} {
  const jour = jourEcheance(bail, proprietaire);
  const echus = moisImpayes(bail, paiements, versements, aujourdhui).filter(
    (p) => aujourdhui > dateEcheance(p, jour),
  );

  const loyerFcfa = echus.length * bail.loyerMensuelFcfa;
  const penalitesFcfa = echus.reduce(
    (somme, periode) => somme + penaliteDuMois(periode, bail, proprietaire, aujourdhui),
    0,
  );
  const sousPreavis = echus.filter(
    (periode) => aujourdhui > dateLimiteTolerance(periode, jour, proprietaire.delaiToleranceJours),
  );

  return {
    mois: echus,
    loyerFcfa,
    penalitesFcfa,
    montantFcfa: loyerFcfa + penalitesFcfa,
    sousPreavis,
  };
}
