import {
  type CleEquipement,
  typeBienLabel,
} from "@/lib/status-labels";
import type { CompositionLot, TypeBien } from "@/lib/types";

export const selectClass =
  "border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-1";

/** Équipements proposés selon le type de bien : un immeuble n'a pas de
 *  garage à la villa, une villa n'a pas d'ascenseur. */
export const equipementsParType: Record<TypeBien, CleEquipement[]> = {
  immeuble: ["ascenseur", "balcon", "garage", "climatisation"],
  residence: ["ascenseur", "balcon", "garage", "climatisation"],
  concession: ["garage", "climatisation"],
  villa: ["garage", "balcon", "climatisation"],
  maison: ["garage", "balcon", "climatisation"],
};

/** Les compositions proposées pour un lot selon le type de bien : une
 *  résidence contient des appartements, une villa est louée en entier, une
 *  concession accueille des cases et parfois une boutique. */
export const compositionsParType: Record<TypeBien, CompositionLot[]> = {
  immeuble: [
    "appartement",
    "studio",
    "2-chambres-salon",
    "chambre-salon",
    "entrer-coucher",
    "boutique",
  ],
  residence: [
    "appartement",
    "studio",
    "2-chambres-salon",
    "chambre-salon",
    "entrer-coucher",
  ],
  concession: [
    "entrer-coucher",
    "chambre-salon",
    "2-chambres-salon",
    "studio",
    "boutique",
  ],
  villa: ["villa", "studio", "chambre-salon", "entrer-coucher"],
  maison: ["villa", "2-chambres-salon", "chambre-salon", "entrer-coucher"],
};

/** Les bâtiments à étages demandent leur hauteur ; les autres types non. */
export const avecEtages: TypeBien[] = ["immeuble", "residence"];

export const typesDeBien = Object.keys(typeBienLabel) as TypeBien[];

/** Les trois étapes du formulaire bien, dans l'ordre. */
export const etapesBien = ["Identité", "Caractéristiques", "Localisation"];
