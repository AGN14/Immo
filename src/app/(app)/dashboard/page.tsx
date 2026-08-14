import Link from "next/link";
import { getBauxActifs, getBiens, getDashboardKpis } from "@/lib/mock-data";
import { evaluerQuota, type PlanId } from "@/lib/plans";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/mock-session";
import { LocataireDashboard } from "@/app/(app)/dashboard/LocataireDashboard";
import { BienCard } from "@/components/dashboard/BienCard";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";
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

function ProprietaireDashboard({
  nom,
  plan,
  proprietaireId,
}: {
  nom: string;
  plan?: PlanId;
  proprietaireId: string;
}) {
  const kpis = getDashboardKpis(proprietaireId);
  const quota = evaluerQuota(plan, getBauxActifs(proprietaireId).length);
  const apercu = getBiens(proprietaireId).slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Bienvenue, {nom}.</h1>
      <p className="text-ink-2 mt-2">Vue d&rsquo;ensemble de votre parc locatif pour août 2026.</p>

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
          value="0"
          caption="Bientôt disponible"
          icon={
            <Icon>
              <path d="M14.5 3.5 20.5 9.5 9 21H3v-6Z" />
              <path d="M13 5l6 6" />
            </Icon>
          }
        />
      </div>

      <QuotaBanner quota={quota} />

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
