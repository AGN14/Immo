import { Barre, SqueletteTitre } from "@/components/ui/Squelette";

/**
 * L'attente par défaut de tout l'espace connecté.
 *
 * Next enveloppe automatiquement la page dans un `<Suspense>` dont ceci est le
 * repli : la barre latérale et l'en-tête restent en place et cliquables, seule
 * la zone de contenu attend. Sans ce fichier, un clic ne produisait rien de
 * visible jusqu'à l'arrivée de la page — sur une requête lente, on cliquait
 * deux fois en croyant avoir manqué le lien.
 *
 * Volontairement neutre : c'est le repli des pages qui n'en déclarent pas de
 * plus précis. Dessiner ici un faux tableau le ferait apparaître sur le profil
 * ou les réglages, où il ne ressemblerait à rien de ce qui suit.
 */
export default function Chargement() {
  return (
    <div>
      <SqueletteTitre />
      <div className="border-line bg-surface mt-8 rounded-md border p-6">
        <div className="flex flex-col gap-3">
          <Barre w="70%" />
          <Barre w="85%" />
          <Barre w="55%" />
        </div>
      </div>
    </div>
  );
}
