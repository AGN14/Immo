import type { Bien, Lot } from "@/lib/types";

export const biens: Bien[] = [
  // ---------------------------------------------------------- Thierry Yerima
  {
    id: "baobab",
    proprietaireId: "prop-thierry",
    nom: "Résidence Baobab",
    type: "immeuble",
    adresse: "12 Rue des Almadies",
    quartier: "Almadies",
    ville: "Dakar",
    dateAjout: "2025-02-10",
  },
  {
    id: "cite-fleurs",
    proprietaireId: "prop-thierry",
    nom: "Cité Fleurs",
    type: "residence",
    adresse: "Rue des Jardins, Lot 12",
    quartier: "Cocody",
    ville: "Abidjan",
    dateAjout: "2025-06-01",
  },
  {
    id: "bonanjo",
    proprietaireId: "prop-thierry",
    nom: "Studio Bonanjo",
    type: "maison",
    adresse: "Avenue de la Liberté",
    quartier: "Bonanjo",
    ville: "Douala",
    dateAjout: "2025-09-14",
  },
  {
    id: "akwa",
    proprietaireId: "prop-thierry",
    nom: "Immeuble Akwa",
    type: "immeuble",
    adresse: "Boulevard de la Liberté",
    quartier: "Akwa",
    ville: "Douala",
    dateAjout: "2024-11-20",
  },
  {
    id: "fidjrosse",
    proprietaireId: "prop-thierry",
    nom: "Concession Fidjrossè",
    type: "concession",
    adresse: "Rue 412",
    quartier: "Fidjrossè",
    ville: "Cotonou",
    dateAjout: "2026-06-02",
  },

  // -------------------------------------------------------------- Awa Traoré
  {
    id: "keur-massar",
    proprietaireId: "prop-awa",
    nom: "Résidence Keur Massar",
    type: "immeuble",
    adresse: "Route de Boune",
    quartier: "Keur Massar",
    ville: "Dakar",
    dateAjout: "2025-11-03",
  },
];

/**
 * Les unités louables, avec leur loyer de référence — ce que le logement vaut,
 * occupé ou non. La Concession Fidjrossè illustre le cas courant : une même
 * adresse, cinq unités de compositions et de prix différents.
 */
export const lots: Lot[] = [
  {
    id: "baobab-3b",
    bienId: "baobab",
    nom: "Appt 3B",
    composition: "appartement",
    loyerReferenceFcfa: 85000,
  },
  {
    id: "baobab-1a",
    bienId: "baobab",
    nom: "Appt 1A",
    composition: "appartement",
    loyerReferenceFcfa: 70000,
  },
  {
    id: "baobab-2c",
    bienId: "baobab",
    nom: "Appt 2C",
    composition: "2-chambres-salon",
    loyerReferenceFcfa: 60000,
  },
  {
    id: "cite-fleurs-12",
    bienId: "cite-fleurs",
    nom: "Villa 12",
    composition: "villa",
    loyerReferenceFcfa: 140000,
  },
  {
    id: "bonanjo-studio",
    bienId: "bonanjo",
    nom: "Studio",
    composition: "studio",
    loyerReferenceFcfa: 45000,
  },
  {
    id: "akwa-2c",
    bienId: "akwa",
    nom: "Appt 2C",
    composition: "appartement",
    loyerReferenceFcfa: 92000,
  },

  {
    id: "fidjrosse-1",
    bienId: "fidjrosse",
    nom: "Chambre 1",
    composition: "chambre-salon",
    loyerReferenceFcfa: 35000,
  },
  {
    id: "fidjrosse-2",
    bienId: "fidjrosse",
    nom: "Chambre 2",
    composition: "2-chambres-salon",
    loyerReferenceFcfa: 60000,
  },
  {
    id: "fidjrosse-3",
    bienId: "fidjrosse",
    nom: "Chambre 3",
    composition: "entrer-coucher",
    loyerReferenceFcfa: 25000,
  },
  {
    id: "fidjrosse-4",
    bienId: "fidjrosse",
    nom: "Chambre 4",
    composition: "chambre-salon",
    loyerReferenceFcfa: 40000,
  },
  {
    id: "fidjrosse-5",
    bienId: "fidjrosse",
    nom: "Chambre 5",
    composition: "entrer-coucher",
    loyerReferenceFcfa: 25000,
  },

  {
    id: "keur-a1",
    bienId: "keur-massar",
    nom: "Appt A1",
    composition: "chambre-salon",
    loyerReferenceFcfa: 55000,
  },
  {
    id: "keur-b2",
    bienId: "keur-massar",
    nom: "Appt B2",
    composition: "2-chambres-salon",
    loyerReferenceFcfa: 60000,
  },
];
