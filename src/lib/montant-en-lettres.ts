/**
 * Un montant écrit en toutes lettres.
 *
 * Ce n'est pas un ornement : sur une quittance, la somme en lettres fait foi
 * contre la somme en chiffres. C'est ce qui empêche d'ajouter un zéro après
 * coup — les quittanciers papier encadrent d'ailleurs le montant chiffré de
 * délimiteurs pour la même raison.
 *
 * Français standard : « quatre-vingts » prend un s seul (80), « cent » aussi
 * (200), mais ni l'un ni l'autre lorsqu'un nombre suit (quatre-vingt-un,
 * deux cent trois). Ces règles sont la raison d'être de ce fichier — une
 * bibliothèque anglophone les ignore.
 */

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
];

const DIZAINES = [
  "", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt",
];

/**
 * `avantMille` supprime les pluriels de « quatre-vingts » et « cents ».
 *
 * Règle française : ces deux mots ne prennent le s que s'ils terminent le
 * nombre. « quatre-vingts » et « deux cents », mais « quatre-vingt mille » et
 * « deux cent mille » — car `mille` est un adjectif invariable qui les suit.
 * Devant `million` ou `milliard`, en revanche, le s revient : ce sont des
 * noms, et l'on écrit bien « deux cents millions ».
 */
function souscent(n: number, avantMille = false): string {
  if (n < 17) return UNITES[n];

  const d = Math.floor(n / 10);
  const u = n % 10;

  // 70-79 et 90-99 se disent « soixante-dix » et « quatre-vingt-dix » :
  // la dizaine reste celle d'en dessous, l'unité monte au-delà de dix.
  if (d === 7 || d === 9) {
    const reste = 10 + u;
    const liaison = d === 7 && reste === 11 ? " et " : "-";
    return `${DIZAINES[d]}${liaison}${UNITES[reste]}`;
  }

  if (u === 0) {
    return DIZAINES[d] === "quatre-vingt" && !avantMille ? "quatre-vingts" : DIZAINES[d];
  }
  // « et un » pour 21, 31… 61, mais « quatre-vingt-un » sans « et ».
  if (u === 1 && d < 8) return `${DIZAINES[d]} et un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}

function souskilo(n: number, avantMille = false): string {
  if (n < 100) return souscent(n, avantMille);

  const c = Math.floor(n / 100);
  const reste = n % 100;
  const prefixe = c === 1 ? "cent" : `${UNITES[c]} cent`;

  if (reste === 0) {
    if (c === 1) return "cent";
    return avantMille ? prefixe : `${prefixe}s`;
  }
  return `${prefixe} ${souscent(reste, avantMille)}`;
}

export function montantEnLettres(montant: number): string {
  const n = Math.floor(Math.abs(montant));
  if (n === 0) return "zéro";

  const milliards = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const unites = n % 1000;

  const morceaux: string[] = [];

  if (milliards > 0) {
    morceaux.push(`${souskilo(milliards)} milliard${milliards > 1 ? "s" : ""}`);
  }
  if (millions > 0) {
    morceaux.push(`${souskilo(millions)} million${millions > 1 ? "s" : ""}`);
  }
  if (milliers > 0) {
    // « mille » est invariable : jamais « deux milles ». Et il fait perdre
    // leur s aux « vingts » et « cents » qui le précèdent.
    morceaux.push(milliers === 1 ? "mille" : `${souskilo(milliers, true)} mille`);
  }
  if (unites > 0) morceaux.push(souskilo(unites));

  return morceaux.join(" ");
}
