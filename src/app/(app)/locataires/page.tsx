import Link from "next/link";
import {
  getBauxActifs,
  getBauxTermines,
  getBiens,
  getLocataires,
  getLots,
  getLotsDisponibles,
  statutLoyerDuBail,
} from "@/lib/data";
import { statutLoyerLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";
import { KPICard } from "@/components/ui/KPICard";
import { ModalAjouterLocataire } from "@/components/locataires/ModalAjouterLocataire";
import { ModalAttribuerLogement } from "@/components/locataires/ModalAttribuerLogement";
import { FormulaireTerminerBail } from "@/components/locataires/FormulaireTerminerBail";

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

export default async function LocatairesPage() {
  const { proprietaireId } = await requireProprietaire();

  const [actifs, anciens, locataires, biens, lots, lotsDisponibles] = await Promise.all([
    getBauxActifs(proprietaireId),
    getBauxTermines(proprietaireId),
    getLocataires(proprietaireId),
    getBiens(proprietaireId),
    getLots(proprietaireId),
    getLotsDisponibles(proprietaireId),
  ]);

  const locataireParId = new Map(locataires.map((l) => [l.id, l]));
  const logement = (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    const bien = lot ? biens.find((b) => b.id === lot.bienId) : undefined;
    return bien && lot ? (
      <Link href={`/biens/${bien.id}`} className="text-primary no-underline">
        {bien.nom} — {lot.nom}
      </Link>
    ) : (
      "—"
    );
  };

  const statuts = new Map(
    (await Promise.all(actifs.map((b) => statutLoyerDuBail(proprietaireId, b.id).then((s) => [b.id, s] as const)))).map(
      ([bailId, statut]) => [bailId, statut],
    ),
  );

  const enRetard = actifs.filter((b) => statuts.get(b.id) === "en-retard");
  const montantEnRetard = enRetard.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const revenusAttendus = actifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const tauxOccupation =
    lots.length === 0 ? null : Math.round((actifs.length / lots.length) * 100);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">Locataires</h1>
          <p className="text-ink-2 mt-2">
            {locataires.length} {locataires.length === 1 ? "locataire" : "locataires"} dans votre
            parc, dont {actifs.length} {actifs.length === 1 ? "logé" : "logés"}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModalAttribuerLogement
            locataires={locataires.map((l) => ({ id: l.id, nom: l.nom }))}
            lotsDisponibles={lotsDisponibles}
          />
          <ModalAjouterLocataire />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Locataires"
          value={String(locataires.length)}
          caption="Dans votre parc"
          icon={
            <Icon>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            </Icon>
          }
        />
        <KPICard
          label="Occupation"
          value={tauxOccupation === null ? "—" : `${tauxOccupation}%`}
          caption={`${actifs.length} / ${lots.length} logements loués`}
          icon={
            <Icon>
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </Icon>
          }
        />
        <KPICard
          label="Loyers en retard"
          value={`${montantEnRetard.toLocaleString("fr-FR")} F`}
          caption={`${enRetard.length} ${enRetard.length === 1 ? "bail" : "baux"} au-delà de l'échéance`}
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5l3 2" />
            </Icon>
          }
        />
        <KPICard
          label="Revenus attendus"
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

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Locataire</th>
              <th className={th}>Logement</th>
              <th className={th}>Téléphone</th>
              <th className={th}>Loyer</th>
              <th className={th}>Statut</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {locataires.length === 0 && (
              <tr>
                <td colSpan={6} className="text-ink-3 px-4 py-12 text-center">
                  Aucun locataire pour l&rsquo;instant. Ajoutez votre premier locataire, puis
                  attribuez-lui un logement.
                </td>
              </tr>
            )}
            {locataires.map((locataire) => {
              const bail = actifs.find((b) => b.locataireId === locataire.id);
              const statut = bail ? statutLoyerLabel[statuts.get(bail.id) ?? "en-attente"] : undefined;
              return (
                <tr key={locataire.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {locataire.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={locataire.photoUrl}
                          alt={`${locataire.nom} — photo`}
                          className="size-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold"
                          aria-hidden="true"
                        >
                          {locataire.nom.trim()[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                      <div>
                        <Link
                          href={`/locataires/${locataire.id}`}
                          className="text-ink hover:text-primary font-semibold no-underline transition-colors"
                        >
                          {locataire.nom}
                        </Link>
                        <div className="text-ink-3">
                          {locataire.email}
                          {locataire.profession ? ` · ${locataire.profession}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{bail ? logement(bail.lotId) : "À loger"}</td>
                  <td className="text-ink-2 px-4 py-3">{locataire.telephone}</td>
                  <td className="text-primary px-4 py-3 font-semibold">
                    {bail ? `${bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {statut ? (
                      <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
                    ) : (
                      <StatusPill tone="mute">À loger</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {bail ? (
                      <FormulaireTerminerBail bailId={bail.id} />
                    ) : (
                      <ModalAttribuerLogement
                        locataires={[{ id: locataire.id, nom: locataire.nom }]}
                        lotsDisponibles={lotsDisponibles}
                        locataireInitial={locataire.id}
                        labelBouton="Attribuer"
                      />
                    )}
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
                      {locataireParId.get(bail.locataireId)?.nom ?? "—"}
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
