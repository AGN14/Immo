import Link from "next/link";
import { avancerSignalement } from "@/lib/actions/proprietaire";
import {
  getBienById,
  getLocataireById,
  getLotById,
  getSignalements,
  getBailById,
} from "@/lib/mock-data";
import { compositionLabel, statutSignalementLabel, urgenceLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";

/** Ce que le propriétaire peut déclencher. « Confirmé » n'y figure pas : il
 *  appartient au locataire, sinon le propriétaire clôt seul. */
const actions: Record<string, { vers: string; label: string; principal: boolean }[]> = {
  signale: [{ vers: "pris-en-charge", label: "Prendre en charge", principal: true }],
  "pris-en-charge": [{ vers: "resolu", label: "Marquer comme résolu", principal: true }],
  resolu: [{ vers: "pris-en-charge", label: "Rouvrir", principal: false }],
  confirme: [],
  annule: [],
};

export default async function SignalementsPage() {
  const { proprietaireId } = await requireProprietaire();
  const signalements = getSignalements(proprietaireId);

  const ouverts = signalements.filter(
    (s) => s.statut === "signale" || s.statut === "pris-en-charge",
  );
  const fermes = signalements.filter((s) => !ouverts.includes(s));

  const carte = (id: string) => {
    const s = signalements.find((x) => x.id === id)!;
    const lot = getLotById(proprietaireId, s.lotId);
    const bien = lot ? getBienById(proprietaireId, lot.bienId) : undefined;
    const bail = s.bailId ? getBailById(proprietaireId, s.bailId) : undefined;
    const locataire = bail ? getLocataireById(proprietaireId, bail.locataireId) : undefined;
    const etat = statutSignalementLabel[s.statut];
    const urgence = urgenceLabel[s.urgence];

    return (
      <li
        key={s.id}
        className={`rounded-md border p-5 ${
          s.urgence === "haute" && s.statut === "signale"
            ? "border-danger bg-danger-soft"
            : "border-line bg-surface"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-ink font-sans text-base font-semibold">{s.titre}</h3>
            <p className="text-ink-3 mt-0.5 text-sm">
              {bien ? (
                <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
                  {bien.nom} — {lot?.nom}
                </Link>
              ) : (
                "—"
              )}
              {lot && ` · ${compositionLabel[lot.composition]}`}
              {locataire && ` · ${locataire.nom}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {s.urgence === "haute" && <StatusPill tone={urgence.tone}>{urgence.label}</StatusPill>}
            <StatusPill tone={etat.tone}>{etat.label}</StatusPill>
          </div>
        </div>

        <p className="text-ink-2 mt-3 text-sm">{s.description}</p>
        <p className="text-ink-3 mt-2 text-sm">
          Signalé le {s.creeLe}
          {s.resoluLe && ` · résolu le ${s.resoluLe}`}
          {s.confirmeLe && ` · confirmé par le locataire le ${s.confirmeLe}`}
        </p>

        {actions[s.statut].length > 0 && (
          <div className="border-line-soft mt-4 flex flex-wrap gap-3 border-t pt-4">
            {actions[s.statut].map((a) => (
              <form key={a.vers} action={avancerSignalement}>
                <input type="hidden" name="signalementId" value={s.id} />
                <input type="hidden" name="vers" value={a.vers} />
                <button
                  type="submit"
                  className={
                    a.principal
                      ? "bg-primary text-on-primary hover:bg-primary-hi rounded-md px-4 py-2 text-sm font-semibold transition-colors"
                      : "border-line text-ink-2 hover:border-ink-3 hover:text-ink rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
                  }
                >
                  {a.label}
                </button>
              </form>
            ))}
          </div>
        )}

        {s.statut === "resolu" && (
          <p className="text-ink-3 mt-3 text-sm">
            En attente de confirmation par le locataire — c&rsquo;est lui qui clôt.
          </p>
        )}
      </li>
    );
  };

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Signalements</h1>
      <p className="text-ink-2 mt-2">
        Pannes et problèmes remontés par vos locataires. Un problème n&rsquo;est clos que lorsque le
        locataire confirme la résolution.
      </p>

      <h2 className="font-display text-ink mt-10 text-2xl font-semibold">
        En cours{ouverts.length > 0 && ` (${ouverts.length})`}
      </h2>
      {ouverts.length === 0 ? (
        <p className="text-ink-3 mt-3 text-sm">Rien à traiter. Tout est en ordre.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">{ouverts.map((s) => carte(s.id))}</ul>
      )}

      {fermes.length > 0 && (
        <>
          <h2 className="font-display text-ink mt-12 text-2xl font-semibold">Clos</h2>
          <ul className="mt-4 flex flex-col gap-4">{fermes.map((s) => carte(s.id))}</ul>
        </>
      )}
    </div>
  );
}
