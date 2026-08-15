import Link from "next/link";
import {
  getBaux,
  getBiens,
  getLocataires,
  getLots,
  getPaiementsPeriodeCourante,
  getQuittancesDesPaiements,
  getVersements,
  periodeCourante,
} from "@/lib/data";
import { methodeLabel, statutVersementLabel } from "@/lib/status-labels";
import { requireProprietaire } from "@/lib/auth/session";
import { StatusPill } from "@/components/ui/StatusPill";
import { KPICard } from "@/components/ui/KPICard";
import { BoutonConfirmerVersement } from "@/components/loyers/BoutonConfirmerVersement";

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

export default async function LoyersPage() {
  const { proprietaireId } = await requireProprietaire();

  const [periode, paiements, versements, baux, lots, biens, locataires] = await Promise.all([
    periodeCourante(),
    getPaiementsPeriodeCourante(proprietaireId),
    getVersements(proprietaireId),
    getBaux(proprietaireId),
    getLots(proprietaireId),
    getBiens(proprietaireId),
    getLocataires(proprietaireId),
  ]);

  const versementParId = new Map(versements.map((v) => [v.id, v]));
  const bailParId = new Map(baux.map((b) => [b.id, b]));
  const lotParId = new Map(lots.map((l) => [l.id, l]));
  const bienParId = new Map(biens.map((b) => [b.id, b]));
  const locataireParId = new Map(locataires.map((l) => [l.id, l]));

  const total = paiements.reduce((sum, p) => sum + p.montantFcfa, 0);
  const encaisse = paiements
    .filter((p) => versementParId.get(p.versementId)?.statut === "confirme")
    .reduce((sum, p) => sum + p.montantFcfa, 0);
  const enAttente = total - encaisse;
  const bauxActifs = baux.filter((b) => b.statut === "actif");
  const attendu = bauxActifs.reduce((sum, b) => sum + b.loyerMensuelFcfa, 0);
  const tauxEncaissement = attendu === 0 ? null : Math.round((encaisse / attendu) * 100);

  // Une seule requête pour toutes les quittances de la période : en boucle,
  // c'était un aller-retour réseau par ligne du tableau.
  const quittanceParPaiement = await getQuittancesDesPaiements(paiements.map((p) => p.id));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-ink text-3xl font-semibold">Loyers</h1>
          <p className="text-ink-2 mt-2">
            Période {periode} —{" "}
            <span className="text-primary font-semibold" data-numeric>
              {encaisse.toLocaleString("fr-FR")} / {total.toLocaleString("fr-FR")} F
            </span>{" "}
            confirmés.
          </p>
        </div>
        <Link
          href="/loyers/export"
          className="border-line text-ink hover:border-ink-3 rounded-md border px-4 py-2.5 text-sm font-semibold no-underline transition-colors"
        >
          Exporter en CSV
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Encaissé ce mois"
          value={`${encaisse.toLocaleString("fr-FR")} F`}
          caption="Versements confirmés"
          icon={
            <Icon>
              <path d="M4 19V10M10 19V5M16 19v-7M4 19h16" />
            </Icon>
          }
        />
        <KPICard
          label="Déclaré, à confirmer"
          value={`${enAttente.toLocaleString("fr-FR")} F`}
          caption="Versements initiés"
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5l3 2" />
            </Icon>
          }
        />
        <KPICard
          label="Attendu ce mois"
          value={`${attendu.toLocaleString("fr-FR")} F`}
          caption={`${bauxActifs.length} baux actifs`}
          icon={
            <Icon>
              <rect x="3" y="7" width="18" height="12" rx="2" />
              <circle cx="12" cy="13" r="2" />
            </Icon>
          }
        />
        <KPICard
          label="Taux d'encaissement"
          value={tauxEncaissement === null ? "—" : `${tauxEncaissement}%`}
          caption="Encaissé vs attendu"
          icon={
            <Icon>
              <path d="M12 3v18M8.5 6.5A3 3 0 0 1 11 5.5h2a2.5 2.5 0 0 1 0 5h-3a2.5 2.5 0 0 0 0 5h3a3 3 0 0 0 2.5-1.5" />
            </Icon>
          }
        />
      </div>

      <div className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line bg-sand border-b">
              <th className={th}>Logement</th>
              <th className={th}>Locataire</th>
              <th className={th}>Montant</th>
              <th className={th}>Moyen</th>
              <th className={th}>Versement</th>
              <th className={th}>Quittance</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {paiements.length === 0 && (
              <tr>
                <td colSpan={7} className="text-ink-3 px-4 py-12 text-center">
                  Aucun paiement déclaré sur cette période. Les versements de vos locataires
                  apparaîtront ici.
                </td>
              </tr>
            )}
            {paiements.map((p) => {
              const bail = bailParId.get(p.bailId);
              const lot = bail ? lotParId.get(bail.lotId) : undefined;
              const bien = lot ? bienParId.get(lot.bienId) : undefined;
              const locataire = bail ? locataireParId.get(bail.locataireId) : undefined;
              const versement = versementParId.get(p.versementId);
              const statut = versement ? statutVersementLabel[versement.statut] : undefined;
              const quittance = quittanceParPaiement.get(p.id);

              return (
                <tr key={p.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3">
                    {bien && lot ? (
                      <Link href={`/biens/${bien.slug}`} className="text-primary no-underline">
                        {bien.nom} — {lot.nom}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {locataire ? (
                      <Link
                        href={`/locataires/${locataire.id}`}
                        className="text-ink hover:text-primary font-semibold no-underline transition-colors"
                      >
                        {locataire.nom}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-primary font-semibold">
                      {p.montantFcfa.toLocaleString("fr-FR")} F
                    </span>
                    {/* L'amende est annoncée à part : le loyer reste le loyer,
                        mais le relevé bancaire porte la somme des deux. */}
                    {p.penaliteFcfa > 0 && (
                      <span className="text-danger block text-xs font-semibold" data-numeric>
                        + {p.penaliteFcfa.toLocaleString("fr-FR")} F d&rsquo;amende
                      </span>
                    )}
                  </td>
                  <td className="text-ink-2 px-4 py-3">
                    {versement ? methodeLabel[versement.methode] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {statut && <StatusPill tone={statut.tone}>{statut.label}</StatusPill>}
                  </td>
                  <td className="text-ink-2 px-4 py-3" data-numeric>
                    {quittance ? quittance.numero : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {versement?.statut === "initie" && (
                      <BoutonConfirmerVersement versementId={versement.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-ink-3 mt-4 text-sm">
        Un mois sans ligne n&rsquo;a pas été payé : son retard se déduit de la date
        d&rsquo;échéance, rien n&rsquo;est stocké.
      </p>
    </div>
  );
}
