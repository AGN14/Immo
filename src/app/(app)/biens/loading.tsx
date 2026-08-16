import { SqueletteCartes, SqueletteTitre } from "@/components/ui/Squelette";

/** Les biens s'affichent en cartes : l'attente en prend la forme. */
export default function Chargement() {
  return (
    <div>
      <SqueletteTitre />
      <SqueletteCartes />
    </div>
  );
}
