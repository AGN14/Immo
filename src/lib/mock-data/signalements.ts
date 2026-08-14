import type { Signalement } from "@/lib/types";

/**
 * Rattachés au lot : la fuite reste attachée au logement, pas au locataire qui
 * l'a subie. `bailId` retient qui l'a signalée.
 */
export const signalements: Signalement[] = [
  {
    id: "sig-1",
    lotId: "baobab-3b",
    bailId: "bail-baobab-3b",
    titre: "Fuite sous l'évier de la cuisine",
    description:
      "L'eau coule dès qu'on ouvre le robinet. J'ai mis une bassine mais le placard commence à gonfler.",
    urgence: "haute",
    statut: "pris-en-charge",
    creeLe: "2026-08-09",
  },
  {
    id: "sig-2",
    lotId: "baobab-1a",
    bailId: "bail-baobab-1a",
    titre: "Prise du salon hors service",
    description: "La prise à côté de la fenêtre ne donne plus de courant depuis dimanche.",
    urgence: "normale",
    statut: "signale",
    creeLe: "2026-08-12",
  },
  {
    id: "sig-3",
    lotId: "cite-fleurs-12",
    bailId: "bail-cite-fleurs-12",
    titre: "Portail difficile à fermer",
    description: "Le gond du bas a pris du jeu, il faut soulever le portail pour le verrouiller.",
    urgence: "basse",
    statut: "confirme",
    creeLe: "2026-06-18",
    resoluLe: "2026-06-24",
    confirmeLe: "2026-06-25",
  },
];
