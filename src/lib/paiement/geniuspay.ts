import "server-only";

import { headers } from "next/headers";

/**
 * Paiement en ligne par GeniusPay — https://geniuspay.ci/docs/api
 *
 * Pas de widget : le serveur crée le paiement et le navigateur est redirigé
 * vers la page de checkout GeniusPay. À la fin, GeniusPay renvoie vers nos
 * URLs de retour, et le serveur VÉRIFIE la transaction avant d'enregistrer
 * quoi que ce soit. Le navigateur ne voit jamais les clés, et ne transmet
 * rien de confiance : ni montant, ni statut.
 *
 * Même point de confiance que l'ancien connecteur : on ne croit que
 * GeniusPay, interrogé depuis le serveur, et on contrôle que le montant
 * encaissé couvre ce qui était dû. Sans ce contrôle, on paierait un franc
 * pour solder trois mois de loyer.
 *
 * Les clés choisissent le monde (bac à sable ou production) : mêmes
 * identifiants de variables, préfixes `sk_sandbox_` / `pk_live_` selon le
 * cas. `GENIUSPAY_SANDBOX` ne fait que refléter le choix dans l'interface.
 */

const BASE = "https://geniuspay.ci/api/v1/merchant";

export interface TransactionVerifiee {
  valide: boolean;
  montantFcfa: number;
  statut: string;
  /** Renseigné quand la vérification échoue, pour la trace serveur. */
  raison?: string;
}

export interface PaiementCree {
  ok: boolean;
  /** Référence GeniusPay (`MTX-...`) : c'est elle qu'on vérifie au retour. */
  reference?: string;
  /** Page de checkout vers laquelle rediriger le navigateur. */
  checkoutUrl?: string;
  erreur?: string;
}

export interface ClientPaiement {
  nom?: string;
  email?: string;
  telephone?: string;
}

function lireVariable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. ` +
        `Renseignez-la depuis GeniusPay → Paramètres → API.`,
    );
  }
  return valeur;
}

function entetes() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": lireVariable("GENIUSPAY_PUBLIC_KEY"),
    "X-API-Secret": lireVariable("GENIUSPAY_SECRET_KEY"),
  };
}

/** L'origine réelle de la requête, pour construire les URLs de retour. */
export async function originePaiement(): Promise<string> {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocole = h.get("x-forwarded-proto") ?? "http";
  return `${protocole}://${hote}`;
}

/**
 * Crée un paiement côté GeniusPay (sans `payment_method` : le client choisit
 * son moyen sur la page de checkout) et rend l'URL vers laquelle rediriger.
 */
export async function creerPaiement({
  montantFcfa,
  description,
  client,
  metadata,
  successUrl,
  errorUrl,
}: {
  montantFcfa: number;
  description: string;
  client: ClientPaiement;
  metadata: Record<string, string>;
  successUrl: string;
  errorUrl: string;
}): Promise<PaiementCree> {
  // Minimum imposé par GeniusPay : en dessous, leur API répond 422 et le
  // client attendrait un checkout qui ne viendra jamais.
  if (!Number.isInteger(montantFcfa) || montantFcfa < 200) {
    return { ok: false, erreur: "Montant trop faible pour le paiement en ligne (minimum 200 F)." };
  }

  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}/payments`, {
      method: "POST",
      headers: entetes(),
      body: JSON.stringify({
        amount: montantFcfa,
        currency: "XOF",
        description: description.slice(0, 500),
        customer: {
          ...(client.nom ? { name: client.nom } : {}),
          ...(client.email ? { email: client.email } : {}),
          ...(client.telephone ? { phone: client.telephone } : {}),
        },
        metadata,
        success_url: successUrl,
        error_url: errorUrl,
      }),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, erreur: `Paiement non initié : ${e instanceof Error ? e.message : "réseau injoignable"}.` };
  }

  if (reponse.status === 401) {
    return { ok: false, erreur: "Clés GeniusPay refusées. Vérifiez le bac à sable et les clés." };
  }
  if (!reponse.ok) {
    return { ok: false, erreur: "Paiement non initié par l'opérateur. Réessayez dans un instant." };
  }

  const corps = (await reponse.json()) as {
    success?: boolean;
    data?: { reference?: string; checkout_url?: string; payment_url?: string };
  };
  const reference = corps.data?.reference;
  const checkoutUrl = corps.data?.checkout_url ?? corps.data?.payment_url;

  if (!corps.success || !reference || !checkoutUrl) {
    return { ok: false, erreur: "Réponse d'initiation incomplète. Réessayez dans un instant." };
  }
  return { ok: true, reference, checkoutUrl };
}

export interface PaiementRecupere {
  trouve: boolean;
  statut: string;
  montantFcfa: number;
  metadata: Record<string, string>;
}

/** Relit une transaction par sa référence, sans jamais rien y écrire. */
export async function recupererPaiement(reference: string): Promise<PaiementRecupere> {
  const inconnu: PaiementRecupere = { trouve: false, statut: "inconnu", montantFcfa: 0, metadata: {} };
  if (!reference.trim()) return inconnu;

  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}/payments/${encodeURIComponent(reference.trim())}`, {
      headers: entetes(),
      cache: "no-store",
    });
  } catch {
    return inconnu;
  }

  if (!reponse.ok) return inconnu;
  const corps = (await reponse.json()) as {
    success?: boolean;
    data?: { status?: string; amount?: number; metadata?: Record<string, string> };
  };
  if (!corps.success || !corps.data) return inconnu;

  return {
    trouve: true,
    statut: String(corps.data.status ?? "inconnu"),
    montantFcfa: Number(corps.data.amount ?? 0),
    metadata: corps.data.metadata ?? {},
  };
}

/**
 * Interroge GeniusPay sur l'état réel d'une transaction.
 *
 * Ne renvoie `valide: true` que sur `completed`. Tout le reste — en attente,
 * en cours, échoué, expiré, erreur réseau — est un échec : en cas de doute,
 * on n'émet pas de quittance.
 */
export async function verifierTransaction(reference: string): Promise<TransactionVerifiee> {
  const echec = (raison: string): TransactionVerifiee => ({
    valide: false,
    montantFcfa: 0,
    statut: "inconnu",
    raison,
  });

  const paiement = await recupererPaiement(reference);
  if (!paiement.trouve) return echec("référence inconnue de l'opérateur");

  return {
    valide: paiement.statut === "completed",
    montantFcfa: paiement.montantFcfa,
    statut: paiement.statut,
    ...(paiement.statut === "completed" ? {} : { raison: `statut ${paiement.statut}` }),
  };
}

/**
 * Liste les derniers paiements, pour retrouver au retour celui qu'on vient
 * d'encaisser sans avoir eu à croire le navigateur sur parole.
 */
export async function listerPaiements({
  statut,
  recherche,
  parPage = 20,
}: {
  statut?: string;
  recherche?: string;
  parPage?: number;
}): Promise<{ reference: string; statut: string; montantFcfa: number; creeLe: string }[]> {
  const params = new URLSearchParams({ per_page: String(Math.min(Math.max(parPage, 1), 100)) });
  if (statut) params.set("status", statut);
  if (recherche) params.set("search", recherche);

  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}/payments?${params}`, { headers: entetes(), cache: "no-store" });
  } catch {
    return [];
  }
  if (!reponse.ok) return [];

  const corps = (await reponse.json()) as {
    success?: boolean;
    data?: { reference?: string; status?: string; amount?: number; created_at?: string }[];
  };
  if (!corps.success || !Array.isArray(corps.data)) return [];

  return corps.data
    .filter((p) => p.reference)
    .map((p) => ({
      reference: String(p.reference),
      statut: String(p.status ?? "inconnu"),
      montantFcfa: Number(p.amount ?? 0),
      creeLe: String(p.created_at ?? ""),
    }));
}

/**
 * Une référence inconnue répond 404 TRANSACTION_NOT_FOUND, et non 401 :
 * c'est la preuve que les clés sont acceptées. Un 401 signale des clés
 * fausses — ou le mauvais monde, les préfixes sandbox et live ne se mélangent
 * pas.
 */
export async function diagnostiquerConfiguration(): Promise<string> {
  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}/account`, { headers: entetes(), cache: "no-store" });
  } catch (e) {
    return `injoignable : ${e instanceof Error ? e.message : "réseau"}`;
  }
  if (reponse.status === 401) return "clés refusées (ou mauvais monde sandbox / live)";
  if (!reponse.ok) return `HTTP ${reponse.status}`;
  const corps = (await reponse.json()) as { data?: { business_name?: string; environment?: string } };
  const qui = corps.data?.business_name ? ` — ${corps.data.business_name}` : "";
  const monde = corps.data?.environment ? ` (${corps.data.environment})` : "";
  return `clés acceptées${qui}${monde}`;
}

/** Vrai si l'intégration est configurée. Permet de masquer le paiement en
 *  ligne tant que les clés ne sont pas renseignées. Serveur uniquement : il
 *  n'y a plus rien à exposer au navigateur. */
export function geniuspayConfigure(): boolean {
  return Boolean(process.env.GENIUSPAY_PUBLIC_KEY && process.env.GENIUSPAY_SECRET_KEY);
}

/** Reflet du monde choisi, pour l'affichage. `GENIUSPAY_SANDBOX` ne pilote
 *  rien côté API : ce sont les préfixes des clés qui tranchent. */
export function geniuspayBacASable(): boolean {
  return process.env.GENIUSPAY_SANDBOX !== "false";
}

/**
 * Reconnaît une référence GeniusPay, dans les deux mondes.
 *
 * Le bac à sable préfixe `SANDBOX_MT...`, la production `MTX-...` : tester
 * un seul préfixe rendrait les paiements sandbox invisibles (ou l'inverse).
 * C'est ce qui distingue les versements initiés en ligne des déclarations
 * manuelles, dont la référence est absente ou libre.
 */
export function estReferenceGeniusPay(reference: string | undefined): boolean {
  const ref = (reference ?? "").toUpperCase();
  return ref.startsWith("MTX-") || ref.startsWith("SANDBOX_MT");
}
