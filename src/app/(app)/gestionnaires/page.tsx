import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { planSuffisant } from "@/lib/plans";
import { getGestionnaires } from "@/lib/data";
import {
  FormulaireAjoutGestionnaire,
  BoutonSupprimerGestionnaire,
} from "@/components/gestionnaires/FormulaireGestionnaire";

export const metadata = { title: "Gestionnaires" };

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

/** Équipe de gestion du parc — réservé au plan Business. */
export default async function GestionnairesPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business")) redirect("/plans");

  const gestionnaires = await getGestionnaires(proprietaireId);

  return (
    <div>
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Gestionnaires</h1>
        <p className="text-ink-2 mt-2">
          Les personnes qui participent à la gestion de votre parc locatif.
        </p>
      </div>

      <section className="border-line bg-surface mt-8 rounded-md border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="font-display text-ink text-lg font-semibold">Ajouter un membre</h2>
        </div>
        <div className="p-4">
          <FormulaireAjoutGestionnaire />
        </div>
      </section>

      <section className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        {gestionnaires.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucun gestionnaire pour l&rsquo;instant. Ajoutez votre premier membre d&rsquo;équipe.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Nom</th>
                <th className={th}>E-mail</th>
                <th className={th}>Téléphone</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {gestionnaires.map((g) => (
                <tr key={g.id} className="text-ink">
                  <td className="px-4 py-3 font-semibold">{g.nom}</td>
                  <td className="text-ink-2 px-4 py-3">{g.email ?? "—"}</td>
                  <td className="text-ink-2 px-4 py-3 tabular-nums">{g.telephone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <BoutonSupprimerGestionnaire id={g.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}