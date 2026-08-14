import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBaux,
  getBienById,
  getLocataires,
  getLotsByBienId,
  getPaiementsByBailId,
  getQuittanceDuPaiement,
  getVersements,
  statutLoyerDuBail,
} from "@/lib/data";
import {
  compositionLabel,
  equipementLabel,
  methodeLabel,
  occupationLabel,
  statutLoyerLabel,
  statutVersementLabel,
  typeBienLabel,
  type CleEquipement,
} from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { StatusPill } from "@/components/ui/StatusPill";
import { ModalAjouterLot } from "@/components/biens/ModalAjouterLot";
import { ModalModifierBien } from "@/components/biens/ModalModifierBien";

const th = "text-ink-2 px-4 py-2.5 text-sm font-medium";

export default async function BienDetailPage(props: PageProps<"/biens/[id]">) {
  const { proprietaireId } = await requireProprietaire();
  const { id } = await props.params;

  // Le bien d'un autre propriétaire est introuvable, pas « interdit » :
  // on ne confirme même pas son existence.
  const bien = await getBienById(proprietaireId, id);
  if (!bien) notFound();

  const [lots, baux, locataires, versements] = await Promise.all([
    getLotsByBienId(proprietaireId, bien.id),
    getBaux(proprietaireId),
    getLocataires(proprietaireId),
    getVersements(proprietaireId),
  ]);

  const bauxDuBien = baux.filter((b) => lots.some((l) => l.id === b.lotId));
  const locataireParId = new Map(locataires.map((l) => [l.id, l]));
  const versementParId = new Map(versements.map((v) => [v.id, v]));

  const bailActifDe = (lotId: string) =>
    bauxDuBien.find((b) => b.lotId === lotId && b.statut === "actif");

  // Encaissé = ce que les baux en cours rapportent réellement.
  // Potentiel = ce que le bien rapporterait tous lots loués à leur référence.
  // L'écart est le manque à gagner, presque toujours dû à la vacance.
  const bauxActifs = lots.map((l) => bailActifDe(l.id)).filter((b) => b !== undefined);
  const encaisse = bauxActifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const potentiel = lots.reduce((sum, l) => {
    const bail = bailActifDe(l.id);
    return sum + (l.loyerReferenceFcfa ?? bail?.loyerMensuelFcfa ?? 0);
  }, 0);
  const manqueAGagner = Math.max(0, potentiel - encaisse);

  const faits = [
    { label: "Type", value: typeBienLabel[bien.type] },
    { label: "Lots loués", value: `${bauxActifs.length} / ${lots.length}` },
    { label: "Encaissé", value: `${encaisse.toLocaleString("fr-FR")} F/mois` },
    { label: "Potentiel", value: `${potentiel.toLocaleString("fr-FR")} F/mois` },
  ];

  if (bien.superficieM2) {
    faits.push({ label: "Superficie", value: `${bien.superficieM2} m²` });
  }
  if (bien.etages) {
    faits.push({
      label: "Étages",
      value: bien.etages === 1 ? "Rez-de-chaussée" : `${bien.etages} étages`,
    });
  }

  const equipements = (Object.keys(equipementLabel) as CleEquipement[]).filter((e) => bien[e]);

  return (
    <div>
      <Link href="/biens" className="text-ink-3 hover:text-ink text-sm no-underline">
        ← Tous les biens
      </Link>

      {bien.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bien.imageUrl}
          alt={`${bien.nom} — ${bien.quartier}, ${bien.ville}`}
          className="mt-4 h-56 w-full rounded-md object-cover"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">{bien.nom}</h1>
          <p className="text-ink-2 mt-1">
            {[bien.adresse, bien.quartier, bien.ville].filter(Boolean).join(", ")}
          </p>
          <p className="text-ink-3 mt-1 text-sm">
            {typeBienLabel[bien.type]} · ajouté le{" "}
            {new Date(bien.dateAjout).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <ModalModifierBien bien={bien} />
      </div>

      {bien.description && (
        <p className="text-ink-2 mt-4 max-w-prose leading-relaxed">{bien.description}</p>
      )}

      {equipements.length > 0 || bien.superficieM2 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bien.superficieM2 && (
            <span className="border-line bg-surface text-ink-2 rounded-full border px-3 py-1 text-xs font-medium" data-numeric>
              {bien.superficieM2} m²
            </span>
          )}
          {equipements.map((e) => (
            <span
              key={e}
              className="border-line bg-surface text-ink-2 rounded-full border px-3 py-1 text-xs font-medium"
            >
              {equipementLabel[e]}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="border-line divide-line mt-8 grid grid-cols-2 divide-y rounded-md border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {faits.map((f) => (
          <div key={f.label} className="p-4">
            <dt className="text-ink-3 text-sm">{f.label}</dt>
            <dd className="text-ink mt-1 font-semibold" data-numeric>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {manqueAGagner > 0 && (
        <p className="border-line bg-surface text-ink-2 mt-4 rounded-md border p-4 text-sm">
          <strong className="text-ink font-semibold" data-numeric>
            {manqueAGagner.toLocaleString("fr-FR")} F/mois de manque à gagner
          </strong>{" "}
          — l&rsquo;écart entre ce que ce bien rapporte et ce qu&rsquo;il vaut tous lots loués.
        </p>
      )}

      <h2 className="font-display text-ink mt-12 text-2xl font-semibold">
        {lots.length === 0
          ? "Aucun lot pour l'instant"
          : lots.length === 1
            ? "Le lot"
            : `Les ${lots.length} lots`}
      </h2>
      {lots.length === 0 && (
        <p className="text-ink-2 mt-1 text-sm">
          Créez votre premier logement : c&rsquo;est lui qu&rsquo;on attribue à un locataire.
        </p>
      )}
      <div className="mt-2">
        <ModalAjouterLot bienId={bien.id} />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {lots.map((lot) => {
          const bail = bailActifDe(lot.id);
          const locataire = bail ? locataireParId.get(bail.locataireId) : undefined;
          const occupation = occupationLabel[bail ? "occupe" : "vacant"];
          const historique = bauxDuBien.filter(
            (b) => b.lotId === lot.id && b.statut === "termine",
          );

          return (
            <LotSection
              key={lot.id}
              lot={lot}
              bail={bail}
              locataire={locataire}
              occupation={occupation}
              historique={historique}
              locataireParId={locataireParId}
              versementParId={versementParId}
              proprietaireId={proprietaireId}
            />
          );
        })}
      </div>
    </div>
  );
}

async function LotSection({
  lot,
  bail,
  locataire,
  occupation,
  historique,
  locataireParId,
  versementParId,
  proprietaireId,
}: {
  lot: import("@/lib/types").Lot;
  bail: import("@/lib/types").Bail | undefined;
  locataire: import("@/lib/types").Locataire | undefined;
  occupation: (typeof occupationLabel)["occupe"];
  historique: import("@/lib/types").Bail[];
  locataireParId: Map<string, import("@/lib/types").Locataire>;
  versementParId: Map<string, import("@/lib/types").Versement>;
  proprietaireId: string;
}) {
  const [paiements, statutLoyer] = await Promise.all([
    bail ? getPaiementsByBailId(proprietaireId, bail.id) : Promise.resolve([]),
    bail ? statutLoyerDuBail(proprietaireId, bail.id) : Promise.resolve(undefined),
  ]);

  const quittances = new Map(
    (await Promise.all(paiements.map((p) => getQuittanceDuPaiement(p.id)))).map((q, i) => [
      paiements[i].id,
      q,
    ]),
  );

  return (
    <section className="border-line bg-surface rounded-md border">
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-ink font-sans text-base font-semibold">{lot.nom}</h3>
          <p className="text-ink-3 text-sm">{compositionLabel[lot.composition]}</p>
        </div>
        <div className="flex items-center gap-3">
          {bail ? (
            <span className="text-primary text-sm font-semibold" data-numeric>
              {bail.loyerMensuelFcfa.toLocaleString("fr-FR")} F/mois
            </span>
          ) : (
            <span className="text-ink-3 text-sm" data-numeric>
              {lot.loyerReferenceFcfa
                ? `${lot.loyerReferenceFcfa.toLocaleString("fr-FR")} F/mois attendus`
                : "Prix à définir"}
            </span>
          )}
          <StatusPill tone={occupation.tone}>{occupation.label}</StatusPill>
        </div>
      </header>

      <div className="px-4 py-3">
        {bail && locataire && statutLoyer ? (
          <p className="text-ink-2 flex flex-wrap items-center gap-2 text-sm">
            <span>
              Loué à{" "}
              <Link
                href={`/locataires/${locataire.id}`}
                className="text-ink hover:text-primary font-semibold no-underline transition-colors"
              >
                {locataire.nom}
              </Link>{" "}
              depuis le {bail.dateDebut}
            </span>
            <StatusPill tone={statutLoyerLabel[statutLoyer].tone}>
              {statutLoyerLabel[statutLoyer].label}
            </StatusPill>
            {/* Un loyer sous la référence signale un bail à réviser. */}
            {lot.loyerReferenceFcfa !== undefined &&
              lot.loyerReferenceFcfa > bail.loyerMensuelFcfa && (
                <span className="text-ink-3" data-numeric>
                  · sous la référence de{" "}
                  {(lot.loyerReferenceFcfa - bail.loyerMensuelFcfa).toLocaleString("fr-FR")} F
                </span>
              )}
          </p>
        ) : (
          <p className="text-ink-3 text-sm">
            Lot vacant — il ne compte pas dans votre palier.
          </p>
        )}

        {historique.length > 0 && (
          <p className="text-ink-3 mt-1.5 text-sm">
            {historique.length === 1 ? "Ancien locataire" : "Anciens locataires"} :{" "}
            {historique
              .map(
                (b) =>
                  `${locataireParId.get(b.locataireId)?.nom ?? "—"} (jusqu'au ${b.dateFin})`,
              )
              .join(", ")}
          </p>
        )}
      </div>

      {paiements.length > 0 && (
        <div className="border-line overflow-x-auto border-t">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-line bg-sand border-b">
                <th className={th}>Période</th>
                <th className={th}>Montant</th>
                <th className={th}>Moyen</th>
                <th className={th}>Versement</th>
                <th className={th}>Quittance</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((p) => {
                const versement = versementParId.get(p.versementId);
                const statut = versement
                  ? statutVersementLabel[versement.statut]
                  : undefined;
                const quittance = quittances.get(p.id);
                return (
                  <tr key={p.id} className="border-line border-b last:border-0">
                    <td className="text-ink-2 px-4 py-2.5">{p.periode}</td>
                    <td className="text-primary px-4 py-2.5 font-semibold">
                      {p.montantFcfa.toLocaleString("fr-FR")} F
                    </td>
                    <td className="text-ink-2 px-4 py-2.5">
                      {versement ? methodeLabel[versement.methode] : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {statut && <StatusPill tone={statut.tone}>{statut.label}</StatusPill>}
                    </td>
                    <td className="text-ink-2 px-4 py-2.5" data-numeric>
                      {quittance ? quittance.numero : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
