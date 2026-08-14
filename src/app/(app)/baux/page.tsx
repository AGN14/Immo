import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { planSuffisant } from "@/lib/plans";
import { getBaux, getBiens, getLocataires, getLots } from "@/lib/data";
import { StatusPill } from "@/components/ui/StatusPill";
import { KPICard } from "@/components/ui/KPICard";

export const metadata = { title: "Baux" };

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

const dateFr = (iso?: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

/** Historique complet des baux du parc — réservé au plan Pro. Un bail actif
 *  est une location en cours ; un bail terminé reste consultable. */
export default async function BauxPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "pro")) redirect("/plans");

  const [baux, lots, biens, locataires] = await Promise.all([
    getBaux(proprietaireId),
    getLots(proprietaireId),
    getBiens(proprietaireId),
    getLocataires(proprietaireId),
  ]);

  const lotParId = new Map(lots.map((l) => [l.id, l]));
  const bienParId = new Map(biens.map((b) => [b.id, b]));
  const locataireParId = new Map(locataires.map((l) => [l.id, l]));

  const actifs = baux.filter((b) => b.statut === "actif");
  const termines = baux.filter((b) => b.statut === "termine");
  const loyersMensuels = actifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);

  // Actifs d'abord, puis du plus récent au plus ancien.
  const ranges = [...baux].sort(
    (a, b) =>
      Number(b.statut === "actif") - Number(a.statut === "actif") ||
      b.dateDebut.localeCompare(a.dateDebut),
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Baux</h1>
        <p className="text-ink-2 mt-2">
          L&rsquo;historique complet des locations de votre parc, actives et passées.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Baux actifs"
          value={String(actifs.length)}
          caption="Locations en cours"
          icon={
            <Icon>
              <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />
            </Icon>
          }
        />
        <KPICard
          label="Baux terminés"
          value={String(termines.length)}
          caption="Historique conservé"
          icon={
            <Icon>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 9h18" />
            </Icon>
          }
        />
        <KPICard
          label="Loyers mensuels"
          value={`${loyersMensuels.toLocaleString("fr-FR")} F`}
          caption="Total des baux actifs"
          icon={
            <Icon>
              <rect x="3" y="7" width="18" height="12" rx="2" />
              <circle cx="12" cy="13" r="2" />
            </Icon>
          }
        />
        <KPICard
          label="Total"
          value={String(baux.length)}
          caption="Baux créés depuis le début"
          icon={
            <Icon>
              <path d="M8 6h13M8 12h13M8 18h13" />
              <path d="M3 6h.01M3 12h.01M3 18h.01" />
            </Icon>
          }
        />
      </div>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        {ranges.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucun bail pour l&rsquo;instant. Attribuez un logement depuis la fiche d&rsquo;un
            locataire ou d&rsquo;un bien.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Bien</th>
                <th className={th}>Logement</th>
                <th className={th}>Locataire</th>
                <th className={`${th} text-right`}>Loyer</th>
                <th className={th}>Début</th>
                <th className={th}>Fin</th>
                <th className={th}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {ranges.map((bail) => {
                const lot = lotParId.get(bail.lotId);
                const bien = lot ? bienParId.get(lot.bienId) : undefined;
                const locataire = locataireParId.get(bail.locataireId);
                const actif = bail.statut === "actif";
                return (
                  <tr key={bail.id} className="text-ink">
                    <td className="px-4 py-3">
                      {bien ? (
                        <Link
                          href={`/biens/${bien.id}`}
                          className="text-ink hover:text-primary font-semibold no-underline"
                        >
                          {bien.nom}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-ink-2 px-4 py-3">{lot?.nom ?? "—"}</td>
                    <td className="px-4 py-3">
                      {locataire ? (
                        <Link
                          href={`/locataires/${locataire.id}`}
                          className="text-ink hover:text-primary font-semibold no-underline"
                        >
                          {locataire.nom}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums" data-numeric>
                      {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F
                    </td>
                    <td className="text-ink-2 px-4 py-3">{dateFr(bail.dateDebut)}</td>
                    <td className="text-ink-2 px-4 py-3">{dateFr(bail.dateFin)}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={actif ? "ok" : "mute"}>
                        {actif ? "Actif" : "Terminé"}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
