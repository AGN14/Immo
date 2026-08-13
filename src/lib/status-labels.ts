import type { StatutLoyer, StatutOccupation, StatutPaiement } from "@/lib/types";

export const statutLoyerLabel: Record<
  StatutLoyer,
  { label: string; tone: "ok" | "warn" | "mute" }
> = {
  "a-jour": { label: "À jour", tone: "ok" },
  "en-retard": { label: "En retard", tone: "warn" },
  "en-attente": { label: "En attente", tone: "mute" },
};

export const statutPaiementLabel: Record<
  StatutPaiement,
  { label: string; tone: "ok" | "warn" | "mute" }
> = {
  recu: { label: "Reçu", tone: "ok" },
  "en-attente": { label: "En attente", tone: "mute" },
  echoue: { label: "Échoué", tone: "warn" },
};

export const statutOccupationLabel: Record<
  StatutOccupation,
  { label: string; tone: "ok" | "warn" | "mute" }
> = {
  occupe: { label: "Occupé", tone: "ok" },
  vacant: { label: "Vacant", tone: "mute" },
};

export const methodeLabel: Record<string, string> = {
  "mobile-money": "Mobile Money",
  virement: "Virement",
  especes: "Espèces",
};
