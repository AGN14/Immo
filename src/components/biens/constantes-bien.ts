import {
  type CleEquipement,
  typeBienLabel,
} from "@/lib/status-labels";
import type { TypeBien } from "@/lib/types";

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

/** Les bâtiments à étages demandent leur hauteur ; les autres types non. */
export const avecEtages: TypeBien[] = ["immeuble", "residence"];

export const typesDeBien = Object.keys(typeBienLabel) as TypeBien[];

/** Les trois étapes du formulaire bien, dans l'ordre. */
export const etapesBien = ["Identité", "Caractéristiques", "Localisation"];
