import type { Locataire } from "@/lib/types";

/**
 * Le locataire ne porte ni bien ni loyer : c'est le bail qui les porte.
 * Il porte en revanche l'identifiant de son propriétaire — ses coordonnées ne
 * doivent jamais apparaître dans le parc d'un autre.
 */
export const locataires: Locataire[] = [
  // ---------------------------------------------------------- Thierry Yerima
  {
    id: "fatou-ndiaye",
    proprietaireId: "prop-thierry",
    nom: "Fatou Ndiaye",
    telephone: "+221 77 145 22 08",
    email: "fatou.ndiaye@example.com",
  },
  {
    id: "moussa-sarr",
    proprietaireId: "prop-thierry",
    nom: "Moussa Sarr",
    telephone: "+221 76 302 91 44",
    email: "moussa.sarr@example.com",
  },
  {
    id: "yves-kouassi",
    proprietaireId: "prop-thierry",
    nom: "Yves Kouassi",
    telephone: "+225 07 08 12 34 56",
    email: "yves.kouassi@example.com",
  },
  {
    id: "chantal-mbarga",
    proprietaireId: "prop-thierry",
    nom: "Chantal Mbarga",
    telephone: "+237 6 77 12 34 56",
    email: "chantal.mbarga@example.com",
  },
  {
    id: "paul-mvondo",
    proprietaireId: "prop-thierry",
    nom: "Paul Mvondo",
    telephone: "+237 6 90 45 67 89",
    email: "paul.mvondo@example.com",
  },

  // -------------------------------------------------------------- Awa Traoré
  {
    id: "ousmane-fall",
    proprietaireId: "prop-awa",
    nom: "Ousmane Fall",
    telephone: "+221 77 610 45 12",
    email: "ousmane.fall@example.com",
  },
  {
    id: "aminata-ba",
    proprietaireId: "prop-awa",
    nom: "Aminata Bâ",
    telephone: "+221 78 224 90 37",
    email: "aminata.ba@example.com",
  },
];
