import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBaux,
  getBiens,
  getLocataires,
  getLots,
  getLotsDisponibles,
  getPaiementsByBailId,
  getQuittanceDuPaiement,
  getVersements,
  statutLoyerDuBail,
} from "@/lib/data";
import {
  methodeLabel,
  pieceIdentiteLabel,
  statutLoyerLabel,
  statutVersementLabel,
} from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/session";
import { StatusPill } from "@/components/ui/StatusPill";
import { FormulaireTerminerBail } from "@/components/locataires/FormulaireTerminerBail";
import { ModalAttribuerLogement } from "@/components/locataires/ModalAttribuerLogement";

export const metadata = { title: "Fiche locataire" };

const th = "text-ink-2 px-4 py-2.5 text-sm font-medium";

function dateLisible(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ageDe(iso: string | null) {
  if (!iso) return null;
  const naissance = new Date(`${iso}T00:00:00`);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  if (
    aujourdhui.getMonth() < naissance.getMonth() ||
    (aujourdhui.getMonth() === naissance.getMonth() && aujourdhui.getDate() < naissance.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export default async function LocataireDetailPage(props: PageProps<"/locataires/[id]">) {
  const { proprietaireId } = await requireProprietaire();
  const { id } = await props.params;

  const [locataires, baux, lots, biens, versements, lotsDisponibles] = await Promise.all([
    getLocataires(proprietaireId),
    getBaux(proprietaireId),
    getLots(proprietaireId),
    getBiens(proprietaireId),
    getVersements(proprietaireId),
    getLotsDisponibles(proprietaireId),
  ]);

  const locataire = locataires.find((l) => l.id === id);
  if (!locataire) notFound();

  const bauxDuLocataire = baux.filter((b) => b.locataireId === id);
  const bailActif = bauxDuLocataire.find((b) => b.statut === "actif");
  const anciens = bauxDuLocataire
    .filter((b) => b.statut === "termine")
    .sort((a, b) => (a.dateFin ?? "").localeCompare(b.dateFin ?? ""));

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

  const statut = bailActif ? await statutLoyerDuBail(proprietaireId, bailActif.id) : undefined;

  const paiements = bailActif
    ? await getPaiementsByBailId(proprietaireId, bailActif.id)
    : [];
  const versementParId = new Map(versements.map((v) => [v.id, v]));
  const quittanceParPaiement = new Map(
    (
      await Promise.all(
        paiements.map((p) => getQuittanceDuPaiement(p.id).then((q) => [p.id, q] as const)),
      )
    ).filter(([, q]) => q !== undefined),
  );
  const paiementsTries = [...paiements].sort((a, b) => b.periode.localeCompare(a.periode));

  const initiale = locataire.nom.trim()[0]?.toUpperCase() ?? "?";
  const age = ageDe(locataire.dateNaissance);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/locataires" className="text-ink-3 hover:text-ink text-sm no-underline">
        ← Tous les locataires
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {locataire.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={locataire.photoUrl}
            alt={`${locataire.nom} — photo`}
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <span
            className="bg-primary-soft text-primary grid size-16 place-items-center rounded-full text-xl font-bold"
            aria-hidden="true"
          >
            {initiale}
          </span>
        )}
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">{locataire.nom}</h1>
          {locataire.profession && <p className="text-ink-2">{locataire.profession}</p>}
        </div>
      </div>

      <dl className="border-line divide-line mt-6 grid grid-cols-2 divide-y rounded-md border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <dt className="text-ink-3 text-sm">E-mail</dt>
          <dd className="text-ink mt-1 font-semibold break-all">{locataire.email || "—"}</dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Téléphone</dt>
          <dd className="text-ink mt-1 font-semibold">{locataire.telephone || "—"}</dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Date de naissance</dt>
          <dd className="text-ink mt-1 font-semibold">
            {dateLisible(locataire.dateNaissance)}
            {age !== null ? ` (${age} ans)` : ""}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Pi&egrave;ce d&rsquo;identit&eacute;</dt>
          <dd className="text-ink mt-1 font-semibold">
            {locataire.pieceType
              ? `${pieceIdentiteLabel[locataire.pieceType]}${locataire.pieceNumero ? ` — ${locataire.pieceNumero}` : ""}`
              : "—"}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Logement</dt>
          <dd className="text-ink mt-1 font-semibold">
            {bailActif ? logement(bailActif.lotId) : "—"}
          </dd>
          {!bailActif && (
            <div className="mt-3">
              <ModalAttribuerLogement
                locataires={[{ id: locataire.id, nom: locataire.nom }]}
                lotsDisponibles={lotsDisponibles}
                locataireInitial={locataire.id}
              />
            </div>
          )}
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Loyer mensuel</dt>
          <dd className="text-primary mt-1 font-semibold" data-numeric>
            {bailActif ? `${bailActif.loyerMensuelFcfa.toLocaleString("fr-FR")} F` : "—"}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Occupants</dt>
          <dd className="text-ink mt-1 font-semibold" data-numeric>
            {locataire.occupants ?? "—"}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-ink-3 text-sm">Garant</dt>
          <dd className="text-ink mt-1 font-semibold">
            {locataire.garantNom
              ? `${locataire.garantNom}${locataire.garantTelephone ? ` — ${locataire.garantTelephone}` : ""}`
              : "—"}
          </dd>
        </div>
      </dl>

      {bailActif && (
        <>
          <h2 className="font-display text-ink mt-10 text-2xl font-semibold">Bail en cours</h2>
          <div className="border-line bg-surface mt-3 rounded-md border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-ink-2">
                  Début :{" "}
                  <span className="text-ink font-semibold">{dateLisible(bailActif.dateDebut)}</span>
                </p>
                <p className="text-ink-2">
                  Échéance :{" "}
                  <span className="text-ink font-semibold">
                    le {bailActif.jourEcheance ?? "5"} du mois
                  </span>
                </p>
                <p className="text-ink-2">
                  Loyer :{" "}
                  <span className="text-ink font-semibold" data-numeric>
                    {bailActif.loyerMensuelFcfa.toLocaleString("fr-FR")} F / mois
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statut && <StatusPill tone={statutLoyerLabel[statut].tone}>{statutLoyerLabel[statut].label}</StatusPill>}
                <FormulaireTerminerBail bailId={bailActif.id} dateDebut={bailActif.dateDebut} />
              </div>
            </div>
          </div>

          <h2 className="font-display text-ink mt-10 text-2xl font-semibold">
            Historique des paiements
          </h2>
          <div className="border-line bg-surface mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-line bg-sand border-b">
                  <th className={th}>Mois</th>
                  <th className={th}>Montant</th>
                  <th className={th}>Moyen</th>
                  <th className={th}>Statut</th>
                  <th className={th}>Quittance</th>
                </tr>
              </thead>
              <tbody>
                {paiementsTries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-ink-3 px-4 py-10 text-center">
                      Aucun paiement pour l&rsquo;instant.
                    </td>
                  </tr>
                )}
                {paiementsTries.map((p) => {
                  const versement = versementParId.get(p.versementId);
                  const quittance = quittanceParPaiement.get(p.id);
                  const statut = versement
                    ? statutVersementLabel[versement.statut]
                    : { label: "Réglé", tone: "ok" as const };
                  return (
                    <tr key={p.id} className="border-line border-b last:border-0">
                      <td className="text-ink px-4 py-3 font-semibold">{p.periode}</td>
                      <td className="text-ink-2 px-4 py-3" data-numeric>
                        {p.montantFcfa.toLocaleString("fr-FR")} F
                      </td>
                      <td className="text-ink-2 px-4 py-3">
                        {versement ? methodeLabel[versement.methode] : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={statut.tone}>{statut.label}</StatusPill>
                      </td>
                      <td className="text-ink-2 px-4 py-3">
                        {quittance ? (
                          <span data-numeric>N° {quittance.numero}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {anciens.length > 0 && (
        <>
          <h2 className="font-display text-ink mt-10 text-2xl font-semibold">Baux terminés</h2>
          <div className="border-line bg-surface mt-3 rounded-md border">
            {anciens.map((bail) => (
              <div
                key={bail.id}
                className="border-line flex flex-wrap items-center justify-between gap-3 border-b p-4 text-sm last:border-0"
              >
                <span className="text-ink font-semibold">{logement(bail.lotId)}</span>
                <span className="text-ink-3">
                  {dateLisible(bail.dateDebut)} → {dateLisible(bail.dateFin ?? null)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!bailActif && anciens.length === 0 && (
        <p className="border-line bg-surface text-ink-3 mt-6 rounded-md border p-5 text-center text-sm">
          Ce locataire n&rsquo;a encore ni bail actif ni historique. Attribuez-lui un logement
          depuis la liste des locataires.
        </p>
      )}
    </div>
  );
}