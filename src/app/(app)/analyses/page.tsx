import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/session";
import { planSuffisant } from "@/lib/plans";
import {
  getBaux,
  getBiens,
  getLots,
  getPaiements,
  getVersements,
  getLocataires,
  getSerieLoyers,
  getSerieLoyersAnnee,
} from "@/lib/data";
import { KPICard } from "@/components/ui/KPICard";
import {
  ChartLoyersMensuels,
  ChartEncaissementParBien,
} from "@/components/dashboard/Charts";

export const metadata = { title: "Analyses & Export" };

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      {children}
    </svg>
  );
}

/** Synthèse financière du parc et export — réservé au plan Business. Les
 *  chiffres couvrent tout l'historique, ou une année civile choisie via
 *  `?annee=`. */
export default async function AnalysesPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business")) redirect("/plans");

  const { annee: anneeParam } = await searchParams;

  const [biens, lots, baux, paiements, versements, locataires] = await Promise.all([
    getBiens(proprietaireId),
    getLots(proprietaireId),
    getBaux(proprietaireId),
    getPaiements(proprietaireId),
    getVersements(proprietaireId),
    getLocataires(proprietaireId),
  ]);

  // Années présentes dans les paiements (période « YYYY-MM »), puis celles des
  // baux pour couvrir un parc sans paiements. Tri décroissant.
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

  const annee = anneeParam && annees.includes(anneeParam) ? Number(anneeParam) : null;

  // Filtre par année : seuls les paiements de la période comptent (encaissé et
  // déclaré). Occupation et parc restent des instantanés globaux.
  const paiementsDeLaPeriode = annee
    ? paiements.filter((p) => p.periode.startsWith(`${annee}-`))
    : paiements;

  const serie = annee
    ? await getSerieLoyersAnnee(proprietaireId, annee)
    : await getSerieLoyers(proprietaireId, 12);

  const versementParId = new Map(versements.map((v) => [v.id, v]));
  const confirme = (versementId: string) =>
    versementParId.get(versementId)?.statut === "confirme";

  const encaisse = paiementsDeLaPeriode.filter((p) => confirme(p.versementId));
  const totalEncaisseFcfa = encaisse.reduce((sum, p) => sum + p.montantFcfa, 0);
  const totalAttenduFcfa = paiementsDeLaPeriode.reduce((sum, p) => sum + p.montantFcfa, 0);
  const bauxActifs = baux.filter((b) => b.statut === "actif");
  const tauxEncaissement =
    totalAttenduFcfa === 0 ? null : Math.round((totalEncaisseFcfa / totalAttenduFcfa) * 100);

  // Bilan par bien : lots, baux actifs, encaissé confirmé.
  const lignesBien = biens
    .map((bien) => {
      const lotsDuBien = lots.filter((l) => l.bienId === bien.id);
      const bailIds = new Set(
        baux.filter((b) => lotsDuBien.some((l) => l.id === b.lotId)).map((b) => b.id),
      );
      const encaisseBien = paiementsDeLaPeriode
        .filter((p) => bailIds.has(p.bailId) && confirme(p.versementId))
        .reduce((sum, p) => sum + p.montantFcfa, 0);
      return {
        bien,
        lots: lotsDuBien.length,
        bauxActifs: bauxActifs.filter((b) => lotsDuBien.some((l) => l.id === b.lotId)).length,
        encaisseFcfa: encaisseBien,
      };
    })
    .sort((a, b) => b.encaisseFcfa - a.encaisseFcfa);

  // Vision fiscale : retenue à la source de 12 % sur les loyers bruts
  // (impôt sur les revenus fonciers, Bénin — taux réduit à 10 % pour les
  // assujettis à l'impôt sur les bénéfices). Estimation indicative.
  const impotEstimatifFcfa = Math.round(totalEncaisseFcfa * 0.12);
  const impotReduitFcfa = Math.round(totalEncaisseFcfa * 0.1);
  const lignesGraphique = lignesBien.map(({ bien, encaisseFcfa }) => ({
    label: bien.nom,
    valeurFcfa: encaisseFcfa,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">Analyses &amp; Export</h1>
          <p className="text-ink-2 mt-2">
            {annee
              ? `La performance financière de votre parc en ${annee}.`
              : "La performance financière de votre parc, depuis le premier bail."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action="/analyses" className="flex items-center gap-2">
            <label className="text-ink-3 text-sm">Période</label>
            <select
              name="annee"
              defaultValue={anneeParam ?? ""}
              className="border-line bg-surface text-ink focus-visible:outline-primary rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <option value="">Tout l&rsquo;historique</option>
              {annees.map((a) => (
                <option key={a} value={a}>
                  Année {a}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              Appliquer
            </button>
          </form>
          <Link
            href="/loyers/export"
            className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
          >
            Exporter en CSV
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={annee ? `Encaissé (${annee})` : "Encaissé (total)"}
          value={`${totalEncaisseFcfa.toLocaleString("fr-FR")} F`}
          caption="Versements confirmés"
          icon={
            <Icon>
              <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />
            </Icon>
          }
        />
        <KPICard
          label="Taux d'encaissement"
          value={tauxEncaissement === null ? "—" : `${tauxEncaissement} %`}
          caption={annee ? `Confirmé / déclaré en ${annee}` : "Confirmé / déclaré"}
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l3 3 5-6" />
            </Icon>
          }
        />
        <KPICard
          label="Taux d'occupation"
          value={lots.length ? `${Math.round((bauxActifs.length / lots.length) * 100)} %` : "—"}
          caption={`${bauxActifs.length} baux actifs`}
          icon={
            <Icon>
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </Icon>
          }
        />
        <KPICard
          label="Parc"
          value={`${biens.length} biens · ${lots.length} lots`}
          caption={`${locataires.length} locataires`}
          icon={
            <Icon>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            </Icon>
          }
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="border-line bg-surface rounded-md border p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-ink text-xl font-semibold">Trésorerie</h2>
            <p className="text-ink-3 text-sm">
              {annee ? `Année ${annee}` : "12 derniers mois"}
            </p>
          </div>
          <div className="mt-4">
            <ChartLoyersMensuels serie={serie} />
          </div>
        </section>
        <section className="border-line bg-surface rounded-md border p-5">
          <h2 className="font-display text-ink text-xl font-semibold">Encaissements par bien</h2>
          <div className="mt-4">
            <ChartEncaissementParBien lignes={lignesGraphique} />
          </div>
        </section>
      </div>

      <div className="border-line bg-surface mt-8 rounded-md border p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-ink text-xl font-semibold">Vision fiscale</h2>
          <span className="bg-sand text-ink-2 rounded-sm px-2 py-0.5 text-xs font-semibold">
            Bénin — indicative
          </span>
        </div>
        <p className="text-ink-2 mt-1 max-w-[42em] text-sm leading-relaxed">
          Une estimation de vos obligations sur les loyers encaissés
          {annee ? ` en ${annee}` : ""}, selon le régime béninois des revenus fonciers.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-line rounded-md border p-4">
            <p className="text-ink-3 text-sm">Impôt sur les revenus fonciers</p>
            <p className="text-ink mt-1 text-2xl font-semibold" data-numeric>
              {impotEstimatifFcfa.toLocaleString("fr-FR")} F
            </p>
            <p className="text-ink-2 mt-1 text-xs leading-relaxed">
              12 % des loyers bruts encaissés (retenue à la source par le locataire).
            </p>
          </div>
          <div className="border-line rounded-md border p-4">
            <p className="text-ink-3 text-sm">Si assujetti à l&rsquo;impôt sur les bénéfices</p>
            <p className="text-ink mt-1 text-2xl font-semibold" data-numeric>
              {impotReduitFcfa.toLocaleString("fr-FR")} F
            </p>
            <p className="text-ink-2 mt-1 text-xs leading-relaxed">
              Taux réduit de 10 % des loyers bruts.
            </p>
          </div>
          <div className="border-line rounded-md border p-4">
            <p className="text-ink-3 text-sm">Taxe foncière unique (TFU)</p>
            <p className="text-ink mt-1 text-2xl font-semibold">9 %</p>
            <p className="text-ink-2 mt-1 text-xs leading-relaxed">
              De la valeur locative des immeubles bâtis productifs de revenus — valeur cadastrale,
              non estimable ici.
            </p>
          </div>
        </div>

        <p className="border-line text-ink-3 mt-4 rounded-md border border-dashed p-3 text-xs leading-relaxed">
          Estimation indicative fondée sur vos loyers encaissés ; votre situation réelle dépend de
          votre statut (IRPP, impôt sur les bénéfices, valeur locative). Consultez un conseiller
          fiscal ou la DGI avant toute déclaration.
        </p>
      </div>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="font-display text-ink text-lg font-semibold">Bilan par bien</h2>
        </div>
        {lignesBien.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucun bien pour l&rsquo;instant. Les chiffres apparaîtront dès vos premières locations.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Bien</th>
                <th className={`${th} text-right`}>Lots</th>
                <th className={`${th} text-right`}>Loués</th>
                <th className={`${th} text-right`}>Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {lignesBien.map(({ bien, lots, bauxActifs: loues, encaisseFcfa }) => (
                <tr key={bien.id} className="text-ink">
                  <td className="px-4 py-3">
                    <Link
                      href={`/biens/${bien.slug}`}
                      className="text-ink hover:text-primary font-semibold no-underline"
                    >
                      {bien.nom}
                    </Link>
                    <span className="text-ink-3 ml-2 text-xs">
                      {bien.type} · {bien.ville}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{lots}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{loues}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums" data-numeric>
                    {encaisseFcfa.toLocaleString("fr-FR")} F
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
