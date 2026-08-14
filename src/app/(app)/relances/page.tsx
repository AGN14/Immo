import { redirect } from "next/navigation";
import Link from "next/link";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { planSuffisant } from "@/lib/plans";
import {
  getBaux,
  getBiens,
  getLots,
  getLocataires,
  getPaiements,
  getVersements,
} from "@/lib/data";
import { moisImpayes } from "@/lib/echeances";
import { StatusPill } from "@/components/ui/StatusPill";

export const metadata = { title: "Relances & Alertes" };

const th = "text-ink-2 px-4 py-3 text-sm font-medium";

function labelMois(periode: string) {
  const [annee, mois] = periode.split("-").map(Number);
  return new Date(annee, mois - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function lienWhatsApp(telephone: string, texte: string) {
  const numero = telephone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
}

/** Relances d'impayés et fins de bail — réservé au plan Business. */
export default async function RelancesPage() {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business")) redirect("/plans");

  const [biens, lots, baux, locataires, paiements, versements] = await Promise.all([
    getBiens(proprietaireId),
    getLots(proprietaireId),
    getBaux(proprietaireId),
    getLocataires(proprietaireId),
    getPaiements(proprietaireId),
    getVersements(proprietaireId),
  ]);

  const locataireParId = new Map(locataires.map((l) => [l.id, l]));
  const lotParId = new Map(lots.map((l) => [l.id, l]));
  const bienParLotId = new Map(lots.map((l) => [l.id, biens.find((b) => b.id === l.bienId)]));

  const bauxActifs = baux.filter((b) => b.statut === "actif");

  // Impayés : mois échus et non couverts par bail actif.
  const impayes = bauxActifs
    .map((bail) => ({ bail, mois: moisImpayes(bail, paiements, versements) }))
    .filter(({ mois }) => mois.length > 0)
    .sort((a, b) => b.mois.length - a.mois.length);

  // Fins de bail dans les 90 jours.
  const dans90Jours = new Date();
  dans90Jours.setDate(dans90Jours.getDate() + 90);
  const maintenantMs = new Date().getTime();
  const finsProches = bauxActifs
    .filter((b) => b.dateFin && new Date(b.dateFin) <= dans90Jours)
    .sort((a, b) => (a.dateFin! < b.dateFin! ? -1 : 1))
    .map((bail) => ({
      bail,
      joursRestants: Math.max(
        0,
        Math.ceil((new Date(bail.dateFin!).getTime() - maintenantMs) / (1000 * 60 * 60 * 24)),
      ),
    }));

  const nombreImpayes = impayes.reduce((somme, { mois }) => somme + mois.length, 0);
  const montantDuFcfa = impayes.reduce(
    (somme, { bail, mois }) => somme + mois.length * bail.loyerMensuelFcfa,
    0,
  );

  return (
    <div>
      <div>
        <h1 className="font-display text-ink text-3xl font-semibold">Relances &amp; Alertes</h1>
        <p className="text-ink-2 mt-2">
          {nombreImpayes > 0
            ? `${nombreImpayes} mois impayé${nombreImpayes > 1 ? "s" : ""} · ${montantDuFcfa.toLocaleString("fr-FR")} F à recouvrer.`
            : "Aucun impayé à recouvrer pour l'instant."}
        </p>
      </div>

      <section className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="font-display text-ink text-lg font-semibold">Loyers impayés</h2>
        </div>
        {impayes.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Tous les loyers échus sont couverts. Rien à relancer.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Locataire</th>
                <th className={th}>Logement</th>
                <th className={th}>Mois dus</th>
                <th className={`${th} text-right`}>Montant dû</th>
                <th className={th}>Relance</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {impayes.map(({ bail, mois }) => {
                const locataire = locataireParId.get(bail.locataireId);
                const lot = lotParId.get(bail.lotId);
                const bien = lot ? bienParLotId.get(lot.id) : undefined;
                const texte = `Bonjour ${locataire?.nom ?? ""}, rappel : votre loyer de ${labelMois(mois[0])} (${(bail.loyerMensuelFcfa * mois.length).toLocaleString("fr-FR")} F) n'a pas encore été reçu. Merci de régulariser.`;
                return (
                  <tr key={bail.id} className="text-ink">
                    <td className="px-4 py-3">
                      <Link
                        href={`/locataires/${locataire?.id ?? ""}`}
                        className="text-ink hover:text-primary font-semibold no-underline"
                      >
                        {locataire?.nom ?? "—"}
                      </Link>
                    </td>
                    <td className="text-ink-2 px-4 py-3">
                      {bien ? `${bien.nom} — ` : ""}
                      {lot?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-danger font-semibold tabular-nums">
                        {mois.length} mois
                      </span>
                      <span className="text-ink-3 block text-xs">
                        {mois.map(labelMois).join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums" data-numeric>
                      {(bail.loyerMensuelFcfa * mois.length).toLocaleString("fr-FR")} F
                    </td>
                    <td className="px-4 py-3">
                      {locataire?.telephone ? (
                        <a
                          href={lienWhatsApp(locataire.telephone, texte)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-line text-ink hover:border-ink-3 inline-block rounded-md border px-3 py-1.5 text-xs font-semibold no-underline transition-colors"
                        >
                          Rappel WhatsApp
                        </a>
                      ) : (
                        <span className="text-ink-3 text-xs">Pas de numéro</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="border-line bg-surface mt-8 overflow-x-auto rounded-md border">
        <div className="border-line border-b px-4 py-3">
          <h2 className="font-display text-ink text-lg font-semibold">Fins de bail (90 jours)</h2>
        </div>
        {finsProches.length === 0 ? (
          <p className="text-ink-2 p-8 text-center text-sm">
            Aucun bail ne se termine dans les 90 prochains jours.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-line border-b text-left">
                <th className={th}>Locataire</th>
                <th className={th}>Logement</th>
                <th className={th}>Fin du bail</th>
                <th className={th}>Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {finsProches.map(({ bail, joursRestants }) => {
                const locataire = locataireParId.get(bail.locataireId);
                const lot = lotParId.get(bail.lotId);
                const bien = lot ? bienParLotId.get(lot.id) : undefined;
                return (
                  <tr key={bail.id} className="text-ink">
                    <td className="px-4 py-3">
                      <Link
                        href={`/locataires/${locataire?.id ?? ""}`}
                        className="text-ink hover:text-primary font-semibold no-underline"
                      >
                        {locataire?.nom ?? "—"}
                      </Link>
                    </td>
                    <td className="text-ink-2 px-4 py-3">
                      {bien ? `${bien.nom} — ` : ""}
                      {lot?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {new Date(bail.dateFin!).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={joursRestants <= 30 ? "warn" : "mute"}>
                        {joursRestants === 0
                          ? "Se termine aujourd'hui"
                          : `Dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""}`}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}