import type {
  CompositionLot,
  PieceIdentite,
  StatutLoyer,
  StatutSignalement,
  StatutVersement,
  TypeBien,
  UrgenceSignalement,
} from "@/lib/types";

type Tone = "ok" | "warn" | "mute";

export const statutLoyerLabel: Record<StatutLoyer, { label: string; tone: Tone }> = {
  "a-jour": { label: "À jour", tone: "ok" },
  declare: { label: "Déclaré", tone: "mute" },
  "en-attente": { label: "En attente", tone: "mute" },
  "en-retard": { label: "En retard", tone: "warn" },
};

export const statutVersementLabel: Record<StatutVersement, { label: string; tone: Tone }> = {
  initie: { label: "À confirmer", tone: "mute" },
  confirme: { label: "Confirmé", tone: "ok" },
  echoue: { label: "Échoué", tone: "warn" },
  annule: { label: "Annulé", tone: "mute" },
};

export const statutSignalementLabel: Record<StatutSignalement, { label: string; tone: Tone }> = {
  signale: { label: "Signalé", tone: "warn" },
  "pris-en-charge": { label: "Pris en charge", tone: "mute" },
  resolu: { label: "Résolu", tone: "ok" },
  confirme: { label: "Confirmé", tone: "ok" },
  annule: { label: "Annulé", tone: "mute" },
};

export const urgenceLabel: Record<UrgenceSignalement, { label: string; tone: Tone }> = {
  basse: { label: "Basse", tone: "mute" },
  normale: { label: "Normale", tone: "mute" },
  haute: { label: "Urgent", tone: "warn" },
};

/** L'occupation n'est plus un champ stocké : elle se déduit de l'existence d'un bail actif. */
export const occupationLabel: Record<"occupe" | "vacant", { label: string; tone: Tone }> = {
  occupe: { label: "Loué", tone: "ok" },
  vacant: { label: "Vacant", tone: "mute" },
};

export const typeBienLabel: Record<TypeBien, string> = {
  immeuble: "Immeuble",
  residence: "Résidence",
  concession: "Concession",
  villa: "Villa",
  maison: "Maison",
};

export const compositionLabel: Record<CompositionLot, string> = {
  "entrer-coucher": "Entrer-coucher",
  "chambre-salon": "Chambre salon",
  "2-chambres-salon": "2 chambres salon",
  studio: "Studio",
  appartement: "Appartement",
  villa: "Villa",
  boutique: "Boutique",
};

/** Équipements d'un bien. Les clés correspondent aux cases à cocher du formulaire. */
export type CleEquipement = "garage" | "balcon" | "ascenseur" | "climatisation";
export const equipementLabel: Record<CleEquipement, string> = {
  garage: "Garage",
  balcon: "Balcon",
  ascenseur: "Ascenseur",
  climatisation: "Climatisation",
};

export const pieceIdentiteLabel: Record<PieceIdentite, string> = {
  cni: "Carte nationale d'identité",
  passeport: "Passeport",
  permis: "Permis de conduire",
  "carte-sejour": "Carte de séjour",
  autre: "Autre",
};

export const methodeLabel: Record<string, string> = {
  "mobile-money": "Mobile Money",
  virement: "Virement",
  especes: "Espèces",
};
