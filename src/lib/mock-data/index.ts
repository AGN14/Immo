import { biens } from "@/lib/mock-data/biens";
import { locataires } from "@/lib/mock-data/locataires";
import { paiements } from "@/lib/mock-data/paiements";

export { biens, locataires, paiements };

export function getBienById(id: string) {
  return biens.find((b) => b.id === id);
}

export function getLocataireById(id: string) {
  return locataires.find((l) => l.id === id);
}

export function getLocataireByBienId(bienId: string) {
  return locataires.find((l) => l.bienId === bienId);
}

export function getPaiementsByBienId(bienId: string) {
  return paiements
    .filter((p) => p.bienId === bienId)
    .sort((a, b) => b.periode.localeCompare(a.periode));
}

export const PERIODE_COURANTE = "2026-08";

export function getPaiementsPeriodeCourante() {
  return paiements.filter((p) => p.periode === PERIODE_COURANTE);
}

export function getDashboardKpis() {
  const paiementsMois = getPaiementsPeriodeCourante();
  const totalRecuFcfa = paiementsMois
    .filter((p) => p.statut === "recu")
    .reduce((sum, p) => sum + p.montantFcfa, 0);
  const totalEnAttenteFcfa = paiementsMois
    .filter((p) => p.statut !== "recu")
    .reduce((sum, p) => sum + p.montantFcfa, 0);
  const biensOccupes = biens.filter((b) => b.statutOccupation === "occupe").length;

  return {
    totalRecuFcfa,
    totalEnAttenteFcfa,
    biensOccupes,
    biensTotal: biens.length,
    tauxOccupation: Math.round((biensOccupes / biens.length) * 100),
  };
}
