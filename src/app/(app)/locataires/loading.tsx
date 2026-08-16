import { SqueletteTableau, SqueletteTitre } from "@/components/ui/Squelette";

export default function Chargement() {
  return (
    <div>
      <SqueletteTitre />
      <SqueletteTableau colonnes={4} lignes={6} />
    </div>
  );
}
