import Link from "next/link";
import { getBauxActifs, getBiens, getLots } from "@/lib/data";
import { evaluerQuota } from "@/lib/plans";
import { requireProprietaire } from "@/lib/auth/session";
import { BienCard } from "@/components/dashboard/BienCard";
import { QuotaBanner } from "@/components/dashboard/QuotaBanner";
import { ModalAjouterBien } from "@/components/biens/ModalAjouterBien";
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

type Filtre = "tous" | "occupes" | "disponibles";

export default async function BiensPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { proprietaireId, plan } = await requireProprietaire();

  const [biens, lots, bauxActifs] = await Promise.all([
    getBiens(proprietaireId),
    getLots(proprietaireId),
    getBauxActifs(proprietaireId),
  ]);
  const quota = evaluerQuota(plan, bauxActifs.length);

  const lotsParBien = new Map<string, number>();
  for (const lot of lots) {
    lotsParBien.set(lot.bienId, (lotsParBien.get(lot.bienId) ?? 0) + 1);
  }
  // Un bail actif occupe exactement un lot, et le lot n'a qu'un bail actif.
  const lotVersBien = new Map(lots.map((l) => [l.id, l.bienId]));
  const lotsLouesParBien = new Map<string, number>();
  for (const bail of bauxActifs) {
    const bienId = lotVersBien.get(bail.lotId);
    if (bienId === undefined) continue;
    lotsLouesParBien.set(bienId, (lotsLouesParBien.get(bienId) ?? 0) + 1);
  }

  const etatBien = (bienId: string) => {
    const total = lotsParBien.get(bienId) ?? 0;
    const loues = lotsLouesParBien.get(bienId) ?? 0;
    // Sans locataire (ou sans lot encore), un bien est disponible à la location.
    if (total === 0 || loues < total) return "disponibles" as const;
    return "occupes" as const;
  };

  const { statut } = await searchParams;
  const filtre: Filtre = statut === "occupes" || statut === "disponibles" ? statut : "tous";
  const visibles = biens.filter((b) => filtre === "tous" || etatBien(b.id) === filtre);

  const lotsLoues = bauxActifs.length;
  const revenusAttendus = bauxActifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);

  const onglets: { valeur: Filtre; label: string }[] = [
    { valeur: "tous", label: "Tous" },
    { valeur: "occupes", label: "Occupés" },
    { valeur: "disponibles", label: "Disponibles" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">Biens</h1>
          <p className="text-ink-2 mt-2">
            {biens.length} {biens.length === 1 ? "bien" : "biens"}, {lots.length}{" "}
            {lots.length === 1 ? "lot" : "lots"} dans votre parc locatif.
          </p>
        </div>
        <ModalAjouterBien />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Biens"
          value={String(biens.length)}
          caption="Dans votre parc"
          icon={
            <Icon>
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </Icon>
          }
        />
        <KPICard
          label="Logements"
          value={String(lots.length)}
          caption="Au total"
          icon={
            <Icon>
              <rect x="4" y="4" width="7" height="7" rx="1" />
              <rect x="13" y="4" width="7" height="7" rx="1" />
              <rect x="4" y="13" width="7" height="7" rx="1" />
              <rect x="13" y="13" width="7" height="7" rx="1" />
            </Icon>
          }
        />
        <KPICard
          label="Taux d'occupation"
          value={
            lots.length === 0
              ? "—"
              : `${Math.round((lotsLoues / lots.length) * 100)}%`
          }
          caption={`${lotsLoues} / ${lots.length} logements loués`}
          icon={
            <Icon>
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </Icon>
          }
        />
        <KPICard
          label="Loyers attendus"
          value={`${revenusAttendus.toLocaleString("fr-FR")} F`}
          caption="Par mois, baux actifs"
          icon={
            <Icon>
              <rect x="3" y="7" width="18" height="12" rx="2" />
              <circle cx="12" cy="13" r="2" />
            </Icon>
          }
        />
      </div>

      <QuotaBanner quota={quota} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <nav className="border-line bg-sand inline-flex rounded-md border p-1" aria-label="Filtrer les biens">
          {onglets.map((o) => (
            <Link
              key={o.valeur}
              href={o.valeur === "tous" ? "/biens" : `/biens?statut=${o.valeur}`}
              aria-current={filtre === o.valeur ? "page" : undefined}
              className={`rounded px-4 py-1.5 text-sm font-medium no-underline transition-colors ${
                filtre === o.valeur
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {o.label}
            </Link>
          ))}
        </nav>
        {filtre !== "tous" && (
          <p className="text-ink-3 text-sm">
            {visibles.length} {visibles.length === 1 ? "bien" : "biens"} dans ce filtre.
          </p>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="border-line bg-surface mt-4 rounded-md border border-dashed p-10 text-center">
          <p className="text-ink-3 text-sm">
            {biens.length === 0
              ? "Aucun bien pour l'instant. Ajoutez votre premier bien pour commencer."
              : "Aucun bien ne correspond à ce filtre."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((bien) => (
            <BienCard key={bien.id} bien={bien} proprietaireId={proprietaireId} />
          ))}
        </div>
      )}
    </div>
  );
}
