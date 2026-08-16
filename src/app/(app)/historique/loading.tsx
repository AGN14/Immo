import { SqueletteTableau, SqueletteTitre } from "@/components/ui/Squelette";

export default function Chargement() {
  return (
    <div>
      <SqueletteTitre />
      <SqueletteTableau colonnes={5} lignes={6} />
    </div>
  );
}
