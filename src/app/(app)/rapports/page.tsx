import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/session";
import { planSuffisant } from "@/lib/plans";
import { getBaux, getPaiements } from "@/lib/data";

export const metadata = { title: "Rapports" };

const libellesMois = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Centre de rapports — réservé au plan Business. */
export default async function RapportsPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business")) redirect("/plans");

  const [paiements, baux] = await Promise.all([
    getPaiements(proprietaireId),
    getBaux(proprietaireId),
  ]);

  const annees = [
    ...new Set([
      ...paiements.map((p) => p.periode.slice(0, 4)),
      ...baux.map((b) => b.dateDebut.slice(0, 4)),
      new Date().getFullYear().toString(),
    ]),
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  const moisEnCours = libellesMois[new Date().getMonth()];

  return (
    <div>
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Rapports</h1>
        <p className="text-ink-2 mt-2">
          Bilans annuels de votre parc, prêts à transmettre ({moisEnCours} {new Date().getFullYear()}).
        </p>
      </div>

      <section className="border-line bg-surface mt-8 rounded-md border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="font-display text-ink text-lg font-semibold">Bilan annuel</h2>
        </div>
        {annees.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucune donnée disponible pour l&rsquo;instant.
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {annees.map((annee) => (
              <li
                key={annee}
                className="flex items-center justify-between gap-4 px-4 py-4"
              >
                <div>
                  <p className="text-ink font-semibold">Exercice {annee}</p>
                  <p className="text-ink-3 text-xs">
                    Encaissements, occupation et fiscalité estimée
                  </p>
                </div>
                <a
                  href={`/rapports/bilan-annee?annee=${annee}`}
                  className="border-line text-ink hover:border-ink-3 inline-block rounded-md border px-3 py-1.5 text-xs font-semibold no-underline transition-colors"
                >
                  Télécharger le PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-ink-3 mt-6 text-xs">
        Les montants d&rsquo;impôts affichés sont des estimations indicatives — faites valider par
        un conseiller avant toute déclaration.
      </p>
    </div>
  );
}
