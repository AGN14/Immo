import "server-only";

/**
 * Vérification d'une transaction KKiaPay.
 *
 * C'est le seul point de confiance de tout le parcours de paiement en ligne.
 *
 * Le widget rend la main au navigateur avec un identifiant de transaction, et
 * il serait tentant de s'en contenter. Ce serait une faille béante : cet
 * identifiant transite par le poste du locataire, qui peut l'inventer, le
 * rejouer, ou appeler directement l'action serveur sans avoir rien payé.
 *
 * On ne croit donc que KKiaPay, interrogé depuis le serveur avec des
 * identifiants que le navigateur ne voit jamais. Et on ne se contente pas du
 * statut : on vérifie aussi que le MONTANT encaissé correspond à ce qui était
 * dû. Sans ce contrôle, on paierait un franc pour solder trois mois de loyer.
 */

/**
 * Deux mondes étanches, et des clés qui ne franchissent pas la frontière.
 *
 * Les clés de test (`tpk_`, `tsk_`) n'existent que côté bac à sable : sur
 * l'hôte de production, elles renvoient « Invalid API KEY », ce qui laisse
 * croire à une erreur d'identifiants alors qu'on s'est simplement trompé de
 * monde. L'inverse est vrai aussi — d'où le pilotage par variable
 * d'environnement plutôt qu'en dur.
 */
function hote(): string {
  const bacASable = process.env.NEXT_PUBLIC_KKIAPAY_SANDBOX !== "false";
  return bacASable ? "https://api-sandbox.kkiapay.me" : "https://api.kkiapay.me";
}

export interface TransactionVerifiee {
  valide: boolean;
  montantFcfa: number;
  statut: string;
  /** Renseigné quand la vérification échoue, pour la trace serveur. */
  raison?: string;
}

function lireVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. ` +
        `Renseignez-la depuis le tableau de bord KKiaPay, section API.`,
    );
  }
  return valeur;
}

/**
 * Interroge KKiaPay sur l'état réel d'une transaction.
 *
 * Ne renvoie `valide: true` que si l'opérateur confirme un encaissement
 * abouti. Toute autre réponse — transaction inconnue, en attente, échouée,
 * erreur réseau — est traitée comme un échec : en cas de doute, on n'émet pas
 * de quittance.
 */
export async function verifierTransaction(
  transactionId: string,
): Promise<TransactionVerifiee> {
  const echec = (raison: string): TransactionVerifiee => ({
    valide: false,
    montantFcfa: 0,
    statut: "inconnu",
    raison,
  });

  if (!transactionId.trim()) return echec("identifiant vide");

  let reponse: Response;
  try {
    reponse = await fetch(`${hote()}/api/v1/transactions/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": lireVariable("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY"),
        "x-private-key": lireVariable("KKIAPAY_PRIVATE_KEY"),
        "x-secret-key": lireVariable("KKIAPAY_SECRET"),
      },
      body: JSON.stringify({ transactionId }),
      // Aucune mise en cache : l'état d'un paiement change, et une réponse
      // rejouée depuis un cache validerait une transaction déjà consommée.
      cache: "no-store",
    });
  } catch (e) {
    return echec(`appel impossible : ${e instanceof Error ? e.message : "inconnu"}`);
  }

  if (!reponse.ok) return echec(`HTTP ${reponse.status}`);

  const corps = (await reponse.json()) as { status?: string; amount?: number };
  const statut = String(corps.status ?? "inconnu");

  return {
    valide: statut.toUpperCase() === "SUCCESS",
    montantFcfa: Number(corps.amount ?? 0),
    statut,
  };
}

/**
 * Une transaction inexistante répond 400 TRANSACTION_NOT_FOUND, et non 401 :
 * c'est la preuve que les clés sont acceptées. Sert au diagnostic quand rien
 * ne fonctionne — un 401 signale des clés fausses ou le mauvais hôte.
 */
export async function diagnostiquerConfiguration(): Promise<string> {
  const t = await verifierTransaction("SONDE_INEXISTANTE");
  if (t.raison?.startsWith("HTTP 401")) return "clés refusées, ou mauvais hôte (sandbox / production)";
  if (t.raison?.startsWith("HTTP 400")) return "clés acceptées";
  return t.raison ?? "clés acceptées";
}

/** Vrai si l'intégration est configurée. Permet de masquer le bouton de
 *  paiement en ligne tant que les clés ne sont pas renseignées. */
export function kkiapayConfigure(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY &&
      process.env.KKIAPAY_PRIVATE_KEY &&
      process.env.KKIAPAY_SECRET,
  );
}
