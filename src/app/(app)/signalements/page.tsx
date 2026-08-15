import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProprietaire } from "@/lib/auth/session";
import { planSuffisant } from "@/lib/plans";
import {
  getBaux,
  getBiens,
  getLocataires,
  getLots,
  getPhotosDeSignalements,
  getSignalements,
} from "@/lib/data";
import { statutSignalementLabel, urgenceLabel } from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { ChangerStatutSignalement } from "@/components/signalements/ChangerStatutSignalement";
import type { StatutSignalement } from "@/lib/types";

export const metadata = { title: "Signalements" };

const fermes: StatutSignalement[] = ["resolu", "confirme", "annule"];

function dateLisible(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PageSignalements() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "pro")) redirect("/plans");

  const signalements = await getSignalements(proprietaireId);
  const [baux, lots, biens, locataires, photos] = await Promise.all([
    getBaux(proprietaireId),
    getLots(proprietaireId),
    getBiens(proprietaireId),
    getLocataires(proprietaireId),
    getPhotosDeSignalements(signalements.map((s) => s.id)),
  ]);

  const bienParId = new Map(biens.map((b) => [b.id, b]));
  const lotParId = new Map(lots.map((l) => [l.id, l]));
  const locataireParBailId = new Map(baux.map((b) => [b.id, b.locataireId]));

  const aTraiter = signalements.filter((s) => !fermes.includes(s.statut));
  const closes = signalements.filter((s) => fermes.includes(s.statut));

  const Carte = ({ s }: { s: (typeof signalements)[number] }) => {
    const lot = lotParId.get(s.lotId);
    const bien = lot ? bienParId.get(lot.bienId) : undefined;
    const locataireId = s.bailId ? locataireParBailId.get(s.bailId) : undefined;
    const locataire = locataires.find((l) => l.id === locataireId);

    return (
      <article className="border-line bg-surface rounded-md border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-ink font-semibold">{s.titre}</h3>
            <StatusPill tone={urgenceLabel[s.urgence].tone}>
              {urgenceLabel[s.urgence].label}
            </StatusPill>
            <StatusPill tone={statutSignalementLabel[s.statut].tone}>
              {statutSignalementLabel[s.statut].label}
            </StatusPill>
          </div>
          <span className="text-ink-3 text-sm">{dateLisible(s.creeLe)}</span>
        </div>

        <p className="text-ink-2 mt-2 text-sm">{s.description}</p>

        <div className="text-ink-2 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {bien && lot && (
            <Link href={`/biens/${bien.slug}`} className="text-primary no-underline">
              {bien.nom} — {lot.nom}
            </Link>
          )}
          {locataire && (
            <Link
              href={`/locataires/${locataire.id}`}
              className="text-primary no-underline"
            >
              signalé par {locataire.nom}
            </Link>
          )}
        </div>

        {photos[s.id]?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos[s.id].map((chemin, i) => (
              <img
                key={chemin + i}
                src={chemin}
                alt={`Photo ${i + 1} du signalement`}
                className="size-16 rounded-md object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-4">
          <ChangerStatutSignalement signalementId={s.id} statut={s.statut} />
        </div>
      </article>
    );
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">Signalements</h1>
          <p className="text-ink-2 mt-1">
            {aTraiter.length} à traiter, {closes.length} clos
            {signalements.length > 0 ? `, ${signalements.length} au total` : ""}.
          </p>
        </div>
      </header>

      {signalements.length === 0 && (
        <p className="border-line text-ink-2 bg-surface mt-6 rounded-md border p-8 text-center text-sm">
          Aucun signalement pour l&rsquo;instant : vos locataires peuvent vous
          alerter depuis leur espace.
        </p>
      )}

      {aTraiter.length > 0 && (
        <section className="mt-6">
          <h2 className="text-ink-2 mb-3 text-sm font-semibold uppercase tracking-wide">
            À traiter
          </h2>
          <div className="flex flex-col gap-4">
            {aTraiter.map((s) => (
              <Carte key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {closes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-ink-2 mb-3 text-sm font-semibold uppercase tracking-wide">
            Clos
          </h2>
          <div className="flex flex-col gap-4 opacity-80">
            {closes.map((s) => (
              <Carte key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
