export type TypeBien = "appartement" | "villa" | "studio" | "immeuble";
export type StatutOccupation = "occupe" | "vacant";
export type StatutLoyer = "a-jour" | "en-retard" | "en-attente";
export type MethodePaiement = "mobile-money" | "virement" | "especes";
export type StatutPaiement = "recu" | "en-attente" | "echoue";

export interface Bien {
  id: string;
  nom: string;
  type: TypeBien;
  adresse: string;
  quartier: string;
  ville: string;
  loyerMensuelFcfa: number;
  statutOccupation: StatutOccupation;
  locataireId?: string;
  dateAjout: string;
}

export interface Locataire {
  id: string;
  bienId: string;
  nom: string;
  telephone: string;
  email: string;
  statutLoyer: StatutLoyer;
  dateEntree: string;
}

export interface Paiement {
  id: string;
  bienId: string;
  locataireId: string;
  periode: string;
  montantFcfa: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  datePaiement?: string;
}
