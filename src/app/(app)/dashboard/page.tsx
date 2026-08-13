import Link from "next/link";
import { biens, getDashboardKpis } from "@/lib/mock-data";
import { getSession } from "@/lib/auth/mock-session";
import { BienCard } from "@/components/app/BienCard";
import { KPICard } from "@/components/ui/KPICard";

function ProprietaireDashboard({ nom }: { nom: string }) {
  const kpis = getDashboardKpis();
  const apercu = biens.slice(0, 3);

  return (
    <div>
      <span className="text-primary-deep font-mono text-[0.76rem] font-semibold tracking-[0.14em] uppercase">
        Espace propriétaire
      </span>
      <h1 className="font-display text-ink mt-2 text-[1.9rem] font-bold">Bienvenue, {nom}.</h1>
      <p className="text-ink-2 mt-3 max-w-[46em] text-[0.95rem]">
        Vue d&rsquo;ensemble de votre parc locatif pour août 2026.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Loyers reçus"
          value={`${kpis.totalRecuFcfa.toLocaleString("fr-FR")} F`}
          caption="Ce mois-ci"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
            >
              <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />
            </svg>
          }
        />
        <KPICard
          label="En attente"
          value={`${kpis.totalEnAttenteFcfa.toLocaleString("fr-FR")} F`}
          caption="À encaisser"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5l3 2" />
            </svg>
          }
        />
        <KPICard
          label="Biens occupés"
          value={`${kpis.biensOccupes} / ${kpis.biensTotal}`}
          caption={`${kpis.tauxOccupation}% d'occupation`}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
            >
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          }
        />
        <KPICard
          label="Litiges & pannes"
          value="0"
          caption="Bientôt disponible"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
            >
              <path d="M14.5 3.5 20.5 9.5 9 21H3v-6Z" />
              <path d="M13 5l6 6" />
            </svg>
          }
        />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-ink text-[1.2rem] font-bold">Vos biens</h2>
        <Link href="/biens" className="text-primary text-[0.86rem] font-semibold no-underline">
          Voir tous les biens →
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apercu.map((bien) => (
          <BienCard key={bien.id} bien={bien} />
        ))}
      </div>
    </div>
  );
}

function LocataireDashboard({ nom, codeBien }: { nom: string; codeBien?: string }) {
  return (
    <div>
      <span className="text-primary-deep font-mono text-[0.76rem] font-semibold tracking-[0.14em] uppercase">
        Espace locataire
      </span>
      <h1 className="font-display text-ink mt-2 text-[1.9rem] font-bold">Bienvenue, {nom}.</h1>
      <p className="text-ink-2 mt-3 max-w-[46em] text-[0.95rem]">
        Votre compte locataire est prêt.{" "}
        {codeBien && (
          <>
            Vous avez rejoint le bien <strong className="text-ink">{codeBien}</strong>.{" "}
          </>
        )}
        Le paiement du loyer, le signalement de pannes et le suivi des litiges arrivent dans les
        prochaines étapes du produit.
      </p>

      <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-6 text-center">
        <p className="text-ink-3 text-[0.86rem]">
          Le tableau de bord locataire complet (paiement du loyer, pannes, litiges) arrive dans les
          prochaines phases.
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const nom = session?.nom ?? "Vous";

  if (session?.role === "locataire") {
    return <LocataireDashboard nom={nom} codeBien={session.codeBien} />;
  }

  return <ProprietaireDashboard nom={nom} />;
}
