import type { Bail } from "@/lib/types";

/**
 * Trois baux actifs, deux terminés, et deux lots jamais loués.
 * Ce jeu de données illustre les trois règles du quota :
 * seuls les baux actifs comptent, un départ libère la place, un lot vacant est gratuit.
 */
export const baux: Bail[] = [
  {
    id: "bail-baobab-3b",
    lotId: "baobab-3b",
    locataireId: "fatou-ndiaye",
    loyerMensuelFcfa: 85000,
    dateDebut: "2025-02-15",
    statut: "actif",
  },
  {
    id: "bail-baobab-1a",
    lotId: "baobab-1a",
    locataireId: "moussa-sarr",
    loyerMensuelFcfa: 65000,
    dateDebut: "2025-02-15",
    statut: "actif",
  },
  {
    id: "bail-cite-fleurs-12",
    lotId: "cite-fleurs-12",
    locataireId: "yves-kouassi",
    loyerMensuelFcfa: 140000,
    dateDebut: "2025-06-05",
    statut: "actif",
  },
  {
    id: "bail-bonanjo-studio",
    lotId: "bonanjo-studio",
    locataireId: "chantal-mbarga",
    loyerMensuelFcfa: 45000,
    dateDebut: "2025-09-20",
    dateFin: "2026-06-30",
    statut: "termine",
  },
  {
    id: "bail-akwa-2c",
    lotId: "akwa-2c",
    locataireId: "paul-mvondo",
    loyerMensuelFcfa: 92000,
    dateDebut: "2024-11-25",
    dateFin: "2026-05-31",
    statut: "termine",
  },

  // Parc d'Awa Traoré — 2 baux actifs sur un palier Pro
  {
    id: "bail-keur-a1",
    lotId: "keur-a1",
    locataireId: "ousmane-fall",
    loyerMensuelFcfa: 55000,
    dateDebut: "2025-11-10",
    statut: "actif",
  },
  {
    id: "bail-keur-b2",
    lotId: "keur-b2",
    locataireId: "aminata-ba",
    loyerMensuelFcfa: 60000,
    dateDebut: "2026-01-05",
    statut: "actif",
  },
];
