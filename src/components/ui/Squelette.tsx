/**
 * Les formes d'attente affichées pendant qu'une page se charge.
 *
 * Un squelette plutôt qu'un sablier tournant : il montre la forme de ce qui
 * arrive, si bien que la page ne « saute » pas au moment où les données se
 * posent. Le sablier, lui, ne dit rien d'autre que « patiente », et donne
 * l'impression d'un écran vide qui s'attarde.
 *
 * Aucune de ces formes ne prétend afficher une valeur : pas de faux montants,
 * pas de faux noms. Un chiffre inventé, même une fraction de seconde, se lit
 * comme une donnée réelle.
 */

/** Une barre grise, mesurée en pourcentage de la largeur disponible. */
export function Barre({ w = "100%", h = 12 }: { w?: string; h?: number }) {
  return (
    <span
      className="bg-line-soft block animate-pulse rounded-sm"
      style={{ width: w, height: h }}
    />
  );
}

/** L'en-tête d'une page : son titre, et la phrase qui l'accompagne. */
export function SqueletteTitre({ sousTitre = true }: { sousTitre?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Barre w="min(18rem, 60%)" h={30} />
      {sousTitre && <Barre w="min(30rem, 85%)" h={14} />}
    </div>
  );
}

/**
 * Un tableau en attente. Le nombre de lignes est une contenance plausible, pas
 * une prédiction : mieux vaut un tableau un peu trop long qui se resserre
 * qu'une page qui s'allonge d'un coup sous le curseur.
 */
export function SqueletteTableau({ colonnes = 4, lignes = 6 }: { colonnes?: number; lignes?: number }) {
  return (
    <div className="border-line bg-surface mt-8 overflow-hidden rounded-md border">
      <div className="border-line bg-sand flex gap-4 border-b px-4 py-3.5">
        {Array.from({ length: colonnes }, (_, i) => (
          <div key={i} className="flex-1">
            <Barre w="70%" h={12} />
          </div>
        ))}
      </div>
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="border-line flex gap-4 border-b px-4 py-4 last:border-0">
          {Array.from({ length: colonnes }, (_, j) => (
            <div key={j} className="flex-1">
              {/* Les largeurs alternent : des barres parfaitement alignées
                  ressemblent à une grille de chargement, pas à du contenu. */}
              <Barre w={j === 0 ? "80%" : j % 2 === 0 ? "45%" : "60%"} h={12} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Une grille de cartes — les biens, principalement. */
export function SqueletteCartes({ nombre = 6 }: { nombre?: number }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: nombre }, (_, i) => (
        <div key={i} className="border-line bg-surface rounded-md border p-5">
          <Barre w="65%" h={18} />
          <div className="mt-3">
            <Barre w="90%" h={12} />
          </div>
          <div className="mt-2">
            <Barre w="40%" h={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
