import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/mock-session";
import {
  getBailDuLocataire,
  getLogementDuLocataire,
  getPhotosDeSignalements,
  getSignalementsDuLocataire,
} from "@/lib/data";
import { statutSignalementLabel, urgenceLabel } from "@/lib/status-labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { FormulaireSignalement } from "@/components/signalements/FormulaireSignalement";
import { ConfirmerResolution } from "@/components/signalements/ConfirmerResolution";

export default async function SignalerPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== "locataire" || !session.locataireId) redirect("/dashboard");

  const [bail, logement, signalements] = await Promise.all([
    getBailDuLocataire(session.locataireId),
    getLogementDuLocataire(session.locataireId),
    getSignalementsDuLocataire(session.locataireId),
  ]);
  const photos = await getPhotosDeSignalements(signalements.map((s) => s.id));

  if (!bail) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-ink text-3xl font-semibold">
          Signaler un problème
        </h1>
        <div className="border-line bg-surface mt-8 rounded-md border border-dashed p-8 text-center">
          <p className="text-ink-3 text-sm">
            Aucun bail en cours sur votre compte : rien à signaler pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-ink text-3xl font-semibold">
        Signaler un problème
      </h1>
      <p className="text-ink-2 mt-2">
        Une fuite, une panne, un souci de voisinage ? Décrivez-le : votre
        propriétaire est prévenu immédiatement, avec la photo si vous en joignez
        une.
      </p>

      <div className="border-line bg-surface mt-6 rounded-md border p-6">
        <FormulaireSignalement />
      </div>

      {signalements.length > 0 && (
        <section className="mt-10">
          <h2 className="text-ink-2 text-sm font-semibold uppercase tracking-wide">
            Vos signalements
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {signalements.map((s) => (
              <article key={s.id} className="border-line bg-surface rounded-md border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-ink font-semibold">{s.titre}</h3>
                    <StatusPill tone={urgenceLabel[s.urgence].tone}>
                      {urgenceLabel[s.urgence].label}
                    </StatusPill>
                    <StatusPill tone={statutSignalementLabel[s.statut].tone}>
                      {statutSignalementLabel[s.statut].label}
                    </StatusPill>
                  </div>
                  {logement?.bien && (
                    <span className="text-ink-3 text-sm">
                      {logement.bien.nom}
                      {logement.lot ? ` — ${logement.lot.nom}` : ""}
                    </span>
                  )}
                </div>
                <p className="text-ink-2 mt-2 text-sm">{s.description}</p>
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
                {s.statut === "resolu" && (
                  <ConfirmerResolution signalementId={s.id} />
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
