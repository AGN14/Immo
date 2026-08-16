import { SqueletteTableau, SqueletteTitre } from "@/components/ui/Squelette";

/** La page la plus lourde du propriétaire : tous les baux et leurs échéances. */
export default function Chargement() {
  return (
    <div>
      <SqueletteTitre />
      <SqueletteTableau colonnes={5} lignes={8} />
    </div>
  );
}
