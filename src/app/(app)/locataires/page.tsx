import Link from "next/link";
import {
  getBauxActifs,
  getBauxTermines,
  getBienById,
  getLocataireById,
  getLotById,
  statutLoyerDuBail,
} from "@/lib/mock-data";
import { statutLoyerLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

export default async function LocatairesPage() {
  const { proprietaireId } = await requireProprietaire();
  const actifs = getBauxActifs(proprietaireId);
  const anciens = getBauxTermines(proprietaireId);

  const logement = (lotId: string) => {
    const lot = getLotById(proprietaireId, lotId);
    const bien = lot ? getBienById(proprietaireId, lot.bienId) : undefined;
    return bien && lot ? (
      <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
        {bien.nom} — {lot.nom}
      </Link>
    ) : (
      "—"
    );
  };

  return (
    <div>
      <h1 className="font-display text-ink text-3xl font-semibold">Locataires</h1>
      <p className="text-ink-2 mt-2">
        {actifs.length} {actifs.length === 1 ? "bail actif" : "baux actifs"} dans votre parc.
      </p>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Locataire</th>
              <th className={th}>Logement</th>
              <th className={th}>Téléphone</th>
              <th className={th}>Loyer</th>
              <th className={th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {actifs.map((bail) => {
              const locataire = getLocataireById(proprietaireId, bail.locataireId);
              const statut = statutLoyerLabel[statutLoyerDuBail(proprietaireId, bail.id)];
              return (
                <tr key={bail.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-ink font-semibold">{locataire?.nom ?? "—"}</div>
                    <div className="text-ink-3">{locataire?.email}</div>
                  </td>
                  <td className="px-4 py-3">{logement(bail.lotId)}</td>
                  <td className="text-ink-2 px-4 py-3">{locataire?.telephone}</td>
                  <td className="text-primary px-4 py-3 font-semibold">
                    {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {anciens.length > 0 && (
        <>
          <h2 className="font-display text-ink mt-12 text-2xl font-semibold">Anciens locataires</h2>
          <p className="text-ink-2 mt-1 text-sm">
            Leur historique reste consultable et ne compte pas dans votre palier.
          </p>
          <div className="border-line bg-surface mt-4 overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line bg-sand border-b">
                  <th className={th}>Locataire</th>
                  <th className={th}>Logement</th>
                  <th className={th}>Période</th>
                </tr>
              </thead>
              <tbody>
                {anciens.map((bail) => (
                  <tr key={bail.id} className="border-line border-b last:border-0">
                    <td className="text-ink px-4 py-3 font-semibold">
                      {getLocataireById(proprietaireId, bail.locataireId)?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-3">{logement(bail.lotId)}</td>
                    <td className="text-ink-2 px-4 py-3">
                      {bail.dateDebut} → {bail.dateFin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
