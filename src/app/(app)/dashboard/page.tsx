import {
  getBauxActifs,
  getBiens,
  getDashboardKpis,
  getSerieLoyers,
  getCautions,
  getGestionnaires,
} from "@/lib/data";
import { evaluerQuota, planSuffisant, type PlanId } from "@/lib/plans";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/mock-session";
import { LocataireDashboard } from "@/app/(app)/dashboard/LocataireDashboard";
import { BienCard } from "@/components/dashboard/BienCard";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";
import { ChartLoyersMensuels, DonutOccupation } from "@/components/dashboard/Charts";
import { KPICard } from "@/components/ui/KPICard";

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

async function ProprietaireDashboard({
  nom,
  plan,
  proprietaireId,
}: {
  nom: string;
  plan?: PlanId;
  proprietaireId: string;
}) {
  const [kpis, bauxActifs, biens, serie, cautions, gestionnaires] = await Promise.all([
    getDashboardKpis(proprietaireId),
    getBauxActifs(proprietaireId),
    getBiens(proprietaireId),
    getSerieLoyers(proprietaireId, 6),
    planSuffisant(plan, "business") ? getCautions(proprietaireId) : Promise.resolve([]),
    planSuffisant(plan, "business") ? getGestionnaires(proprietaireId) : Promise.resolve([]),
  ]);
  const quota = evaluerQuota(plan, bauxActifs.length);
  const apercu = biens.slice(0, 3);

  const cautionsEnAttente = cautions.filter((c) => c.statut === "due");

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Bienvenue, {nom}.</h1>
      <p className="text-ink-2 mt-2">Vue d&rsquo;ensemble de votre parc locatif.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Loyers reçus"
          value={`${kpis.totalRecuFcfa.toLocaleString("fr-FR")} F`}
          caption="Ce mois-ci"
          icon={<Icon>{<path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />}</Icon>}
        />
        <KPICard
          label="En attente"
          value={`${kpis.totalEnAttenteFcfa.toLocaleString("fr-FR")} F`}
          caption="À encaisser"
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5l3 2" />
            </Icon>
          }
        />
        <KPICard
          label="Logements loués"
          value={`${kpis.lotsLoues} / ${kpis.lotsTotal}`}
          caption={`${kpis.tauxOccupation}% d'occupation`}
          icon={
            <Icon>
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </Icon>
          }
        />
        <KPICard
          label="Litiges et pannes"
          value={String(kpis.signalementsOuverts)}
          caption="Signalements ouverts"
          icon={
            <Icon>
              <path d="M14.5 3.5 20.5 9.5 9 21H3v-6Z" />
              <path d="M13 5l6 6" />
            </Icon>
          }
        />
      </div>

      <QuotaBanner quota={quota} />

      {planSuffisant(plan, "business") && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/cautions"
            className="border-line bg-surface hover:bg-highlight group flex items-center justify-between rounded-md border p-4 no-underline transition-colors"
          >
            <div>
              <p className="text-ink-3 text-xs font-semibold uppercase tracking-wider">Cautions</p>
              <p className="text-ink mt-1 font-semibold">
                {cautionsEnAttente.length} en attente d&rsquo;encaissement
              </p>
            </div>
            <div className="text-ink-3 group-hover:text-primary transition-colors">
              <Icon>
                <path d="m9 18 6-6-6-6" />
              </Icon>
            </div>
          </Link>
          <Link
            href="/gestionnaires"
            className="border-line bg-surface hover:bg-highlight group flex items-center justify-between rounded-md border p-4 no-underline transition-colors"
          >
            <div>
              <p className="text-ink-3 text-xs font-semibold uppercase tracking-wider">Équipe</p>
              <p className="text-ink mt-1 font-semibold">
                {gestionnaires.length} gestionnaire{gestionnaires.length > 1 ? "s" : ""} actif
                {gestionnaires.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-ink-3 group-hover:text-primary transition-colors">
              <Icon>
                <path d="m9 18 6-6-6-6" />
              </Icon>
            </div>
          </Link>
        </div>
      )}

      {planSuffisant(plan, "pro") ? (
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="border-line bg-surface rounded-md border p-5 lg:col-span-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-ink text-xl font-semibold">Trésorerie</h2>
              <p className="text-ink-3 text-sm">6 derniers mois</p>
            </div>
            <div className="mt-4">
              <ChartLoyersMensuels serie={serie} />
            </div>
          </section>
          <section className="border-line bg-surface rounded-md border p-5">
            <h2 className="font-display text-ink text-xl font-semibold">Occupation</h2>
            <div className="mt-6 flex justify-center">
              <DonutOccupation
                taux={kpis.tauxOccupation}
                lotsLoues={kpis.lotsLoues}
                lotsTotal={kpis.lotsTotal}
              />
            </div>
          </section>
        </div>
      ) : (
        <section className="border-line bg-highlight mt-12 rounded-md border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-ink text-xl font-semibold">
                Graphiques et analyses
              </h2>
              <p className="text-ink-2 mt-1 max-w-[36em] text-sm leading-relaxed">
                Les graphiques de trésorerie, d&rsquo;occupation et les analyses avancées sont
                réservés aux plans Pro et Business.
              </p>
            </div>
            <Link
              href="/plans"
              className="bg-primary text-on-primary hover:bg-primary-hi shadow-cta rounded-md px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
            >
              Découvrir les plans
            </Link>
          </div>
        </section>
      )}

      <div className="mt-12 flex items-baseline justify-between">
        <h2 className="font-display text-ink text-2xl font-semibold">Vos biens</h2>
        <Link href="/biens" className="text-primary text-sm font-semibold no-underline">
          Voir tous les biens
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apercu.map((bien) => (
          <BienCard key={bien.id} bien={bien} proprietaireId={proprietaireId} />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  if (session.role === "locataire") {
    // Même exigence que côté propriétaire : sans identifiant, pas de périmètre.
    if (!session.locataireId) redirect("/connexion");
    return <LocataireDashboard nom={session.nom} locataireId={session.locataireId} />;
  }

  // Un propriétaire sans périmètre est une session invalide : mieux vaut le
  // renvoyer se connecter qu'afficher un parc vide qui ressemble à une panne.
  if (!session.proprietaireId) redirect("/connexion");

  return (
    <ProprietaireDashboard
      nom={session.nom}
      plan={session.plan}
      proprietaireId={session.proprietaireId}
    />
  );
}
