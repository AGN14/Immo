import { baux } from "@/lib/mock-data/baux";
import { biens, lots } from "@/lib/mock-data/biens";
import { moisSuivant, periodeDe } from "@/lib/echeances";
import type { Paiement, Quittance, Versement } from "@/lib/types";

/**
 * Règlements de démonstration.
 *
 * Les derniers mois sont écrits à la main — ce sont eux qui portent les cas
 * intéressants : un paiement groupé sur deux mois, un versement déclaré mais
 * pas encore confirmé, un mois impayé. Tout l'historique antérieur est généré,
 * parce qu'un bail ouvert depuis 2025 avec deux paiements ne serait pas un jeu
 * de données réaliste : le locataire apparaîtrait débiteur de dix-sept mois.
 */

/* -------------------------------------------------- les mois écrits à la main */

const versementsRecents: Versement[] = [
  {
    id: "vers-1",
    bailId: "bail-baobab-3b",
    montantTotalFcfa: 170000,
    methode: "mobile-money",
    referenceExterne: "MP260702.1431.A72910",
    statut: "confirme",
    confirmePar: "proprietaire",
    declareLe: "2026-07-02",
    confirmeLe: "2026-07-02",
  },
  {
    id: "vers-2",
    bailId: "bail-baobab-1a",
    montantTotalFcfa: 65000,
    methode: "mobile-money",
    referenceExterne: "MP260704.0908.B10254",
    statut: "confirme",
    confirmePar: "proprietaire",
    declareLe: "2026-07-04",
    confirmeLe: "2026-07-04",
  },
  {
    id: "vers-3",
    bailId: "bail-baobab-1a",
    montantTotalFcfa: 65000,
    methode: "mobile-money",
    referenceExterne: "MP260803.1102.C88431",
    statut: "initie",
    declareLe: "2026-08-03",
  },
  {
    id: "vers-4",
    bailId: "bail-cite-fleurs-12",
    montantTotalFcfa: 280000,
    methode: "virement",
    referenceExterne: "VIR-2026-0713",
    statut: "confirme",
    confirmePar: "proprietaire",
    declareLe: "2026-07-03",
    confirmeLe: "2026-07-03",
  },
  {
    id: "vers-7",
    bailId: "bail-keur-a1",
    montantTotalFcfa: 55000,
    methode: "mobile-money",
    referenceExterne: "MP260801.0645.E20038",
    statut: "confirme",
    confirmePar: "proprietaire",
    declareLe: "2026-08-01",
    confirmeLe: "2026-08-01",
  },
];

const paiementsRecents: Paiement[] = [
  {
    id: "pay-1",
    bailId: "bail-baobab-3b",
    versementId: "vers-1",
    periode: "2026-07",
    montantFcfa: 85000,
  },
  {
    id: "pay-2",
    bailId: "bail-baobab-3b",
    versementId: "vers-1",
    periode: "2026-08",
    montantFcfa: 85000,
  },
  {
    id: "pay-3",
    bailId: "bail-baobab-1a",
    versementId: "vers-2",
    periode: "2026-07",
    montantFcfa: 65000,
  },
  {
    id: "pay-4",
    bailId: "bail-baobab-1a",
    versementId: "vers-3",
    periode: "2026-08",
    montantFcfa: 65000,
  },
  {
    id: "pay-5",
    bailId: "bail-cite-fleurs-12",
    versementId: "vers-4",
    periode: "2026-07",
    montantFcfa: 140000,
  },
  {
    id: "pay-6",
    bailId: "bail-cite-fleurs-12",
    versementId: "vers-4",
    periode: "2026-08",
    montantFcfa: 140000,
  },
  {
    id: "pay-9",
    bailId: "bail-keur-a1",
    versementId: "vers-7",
    periode: "2026-08",
    montantFcfa: 55000,
  },
];

/* ------------------------------------------------------ génération de l'historique */

const proprietaireDuBail = (bailId: string) => {
  const bail = baux.find((b) => b.id === bailId);
  const lot = lots.find((l) => l.id === bail?.lotId);
  return biens.find((b) => b.id === lot?.bienId)?.proprietaireId ?? "";
};

/** Dernier mois à générer : la veille du premier mois écrit à la main, ou la
 *  fin du bail s'il est terminé. */
function dernierMoisGenere(bailId: string, finBail?: string): string | undefined {
  const explicites = paiementsRecents.filter((p) => p.bailId === bailId).map((p) => p.periode);
  if (explicites.length > 0) return [...explicites].sort()[0];
  if (finBail) return moisSuivant(periodeDe(new Date(finBail)));
  return undefined;
}

const versementsGeneres: Versement[] = [];
const paiementsGeneres: Paiement[] = [];

for (const bail of baux) {
  const borne = dernierMoisGenere(bail.id, bail.dateFin);
  // Awa n'a rien saisi pour Appt B2 en août : le mois reste impayé, et son
  // retard se déduit de l'échéance dépassée.
  const fin = borne ?? periodeDe(new Date());

  let periode = periodeDe(new Date(bail.dateDebut));
  let n = 0;
  while (periode < fin && n < 240) {
    const id = `${bail.id}-${periode}`;
    versementsGeneres.push({
      id: `vers-${id}`,
      bailId: bail.id,
      montantTotalFcfa: bail.loyerMensuelFcfa,
      methode: "mobile-money",
      referenceExterne: `MP${periode.replace("-", "")}.HIST`,
      statut: "confirme",
      confirmePar: "proprietaire",
      declareLe: `${periode}-03`,
      confirmeLe: `${periode}-03`,
    });
    paiementsGeneres.push({
      id: `pay-${id}`,
      bailId: bail.id,
      versementId: `vers-${id}`,
      periode,
      montantFcfa: bail.loyerMensuelFcfa,
    });
    periode = moisSuivant(periode);
    n++;
  }
}

export const versements: Versement[] = [...versementsGeneres, ...versementsRecents];
export const paiements: Paiement[] = [...paiementsGeneres, ...paiementsRecents];

/* ------------------------------------------------------------------ quittances */

/** Une quittance par mois confirmé, numérotée en continu par propriétaire. */
const compteurs = new Map<string, number>();

/**
 * Attribue le prochain numéro d'un propriétaire. La numérotation doit rester
 * continue et sans trou : un trou dans la série invalide la comptabilité.
 * En base, c'est `prochain_numero_quittance()` qui joue ce rôle, en
 * verrouillant la ligne du propriétaire.
 */
export function prochainNumeroQuittance(proprietaireId: string): string {
  const suivant = (compteurs.get(proprietaireId) ?? 0) + 1;
  compteurs.set(proprietaireId, suivant);
  return `${new Date().getFullYear()}-${String(suivant).padStart(4, "0")}`;
}

/** Le propriétaire dont relève un bail — nécessaire pour numéroter. */
export { proprietaireDuBail };

export const quittances: Quittance[] = paiements
  .filter((p) => versements.find((v) => v.id === p.versementId)?.statut === "confirme")
  .sort((a, b) => a.periode.localeCompare(b.periode))
  .map((p) => {
    const proprietaireId = proprietaireDuBail(p.bailId);
    const suivant = (compteurs.get(proprietaireId) ?? 0) + 1;
    compteurs.set(proprietaireId, suivant);
    return {
      id: `q-${p.id}`,
      paiementId: p.id,
      proprietaireId,
      numero: `${p.periode.slice(0, 4)}-${String(suivant).padStart(4, "0")}`,
      emiseLe: `${p.periode}-03`,
    };
  });
