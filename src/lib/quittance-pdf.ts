import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Quittance de loyer, à l'image d'un quittancier pré-imprimé rempli à la main.
 *
 * Deux typographies portent le sens : le « pré-imprimé » en serif bleu marine
 * pour tout ce qui serait déjà sur le carnet — cadre, libellés, titres — et une
 * manuscrite bleu stylo pour ce qui serait écrit à la main. Le lecteur retrouve
 * ainsi le document qu'il connaît, et distingue d'un coup d'œil le formulaire
 * de son contenu.
 *
 * PRINCIPE DE MISE EN PAGE : aucune coordonnée voisine n'est figée. Chaque
 * élément qui en suit un autre est posé après avoir MESURÉ le précédent, via
 * `widthOfTextAtSize`. Un nom de bailleur long, un montant à sept chiffres ou
 * un numéro de quittance à rallonge décalent leurs voisins au lieu de les
 * chevaucher.
 */

export interface Quittance {
  /**
   * La marque en en-tête — l'éditeur du document.
   *
   * Le bailleur, lui, figure comme champ et à la signature : juridiquement,
   * c'est LUI qui atteste avoir reçu le loyer, pas la plateforme. Confondre
   * les deux ferait de Xwégán le créancier.
   */
  marque: string;
  bailleur: string;
  sousTitre: string;
  /** Le téléphone du BAILLEUR, en en-tête. Absent : la ligne disparaît. */
  telSociete?: string;
  /** Celui du LOCATAIRE, champ du corps — à ne pas confondre avec le précédent. */
  telLocataire: string;
  numero: string;
  montantChiffres: string;
  locataire: string;
  sommeLettres: string;
  periode: string;
  residence: string;
  chambre: string;
  adresse: string;
  moyenPaiement: string;
  date: string;
  signataire: string;
}

/* ----------------------------------------------------------------- couleurs */

const NAVY = rgb(0.09, 0.15, 0.4); // le pré-imprimé
const ENCRE = rgb(0.11, 0.2, 0.62); // le stylo
const ROUGE = rgb(0.72, 0.11, 0.13); // le « N° », comme au tampon
const GRIS = rgb(0.45, 0.5, 0.6);
const FOND = rgb(0.985, 0.988, 1);

/* --------------------------------------------------------------- dimensions */

const L = 595.28; // A5 paysage
/**
 * Hauteur portée de 419,53 à 480 pt.
 *
 * L'A5 exact ne laissait que 25 pt entre les champs une fois l'en-tête, le
 * bandeau et les signatures posés — le document paraissait comprimé, et
 * l'ajout du bailleur et du téléphone a fini de le tasser. Ces 60 pt de plus
 * donnent 30 pt entre les lignes, ce qui est l'aération d'un vrai quittancier.
 */
const H = 480;
const MARGE = 22;

/**
 * Les polices standard n'encodent que le jeu WinAnsi. `toLocaleString("fr-FR")`
 * sépare les milliers par une espace fine insécable (U+202F), invisible mais
 * impossible à encoder : la génération échouerait sur « 60 000 ».
 *
 * Caveat, elle, est embarquée et gère l'Unicode — mais on assainit partout,
 * pour que le même texte soit sûr quelle que soit la police qui l'écrit.
 */
function ansi(t: string): string {
  return t.replace(/[   ]/g, " ");
}

/* ------------------------------------------------------------ rectangle rond */

/** pdf-lib n'a pas de rectangle arrondi : on le décrit en SVG. */
function cheminRectArrondi(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

/* --------------------------------------------------------------- drawField */

interface ChampOptions {
  page: PDFPage;
  y: number;
  label: string;
  value?: string;
  labelX: number;
  /** Fin de la ligne pointillée. C'est lui qui permet DEUX champs par ligne. */
  xEnd: number;
  printFont: PDFFont;
  handFont: PDFFont;
  labelSize?: number;
  valueSize?: number;
  couleurValeur?: RGB;
}

/**
 * Une ligne de champ : libellé, pointillés, valeur manuscrite posée dessus.
 *
 * Le départ des pointillés est CALCULÉ après le libellé, jamais fixé : « Reçu
 * la somme de » et « Date » n'ont pas la même longueur, et une valeur codée en
 * dur ferait chevaucher l'un ou laisserait un trou sous l'autre.
 */
export function drawField({
  page,
  y,
  label,
  value,
  labelX,
  xEnd,
  printFont,
  handFont,
  labelSize = 11,
  valueSize = 17,
  couleurValeur = ENCRE,
}: ChampOptions): void {
  const libelle = ansi(label);
  page.drawText(libelle, { x: labelX, y, size: labelSize, font: printFont, color: NAVY });

  const debut = labelX + printFont.widthOfTextAtSize(libelle, labelSize) + 6;
  if (debut >= xEnd) return; // libellé trop long : on n'écrase pas le voisin

  page.drawLine({
    start: { x: debut, y: y - 2 },
    end: { x: xEnd, y: y - 2 },
    thickness: 0.6,
    color: NAVY,
    opacity: 0.55,
    dashArray: [1, 2.4],
  });

  if (!value) return;

  // La valeur est posée SUR la ligne, légèrement au-dessus, comme une écriture
  // manuscrite qui ne mord pas le trait.
  const texte = ansi(value);
  const place = xEnd - debut - 8;
  let taille = valueSize;
  // Une valeur trop longue rétrécit plutôt que de déborder du champ.
  while (taille > 9 && handFont.widthOfTextAtSize(texte, taille) > place) taille -= 0.5;

  page.drawText(texte, { x: debut + 4, y: y + 1.5, size: taille, font: handFont, color: couleurValeur });
}

/* ------------------------------------------------------------------ le PDF */

export async function buildQuittance(data: Quittance): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Obligatoire AVANT tout embedFont d'une police non standard.
  doc.registerFontkit(fontkit);

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifGras = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  /**
   * Police STATIQUE, et c'est essentiel.
   *
   * La variable (Caveat[wght].ttf) s'embarque sans lever d'erreur mais produit
   * des correspondances de glyphes fausses : « Juillet » s'affiche « JuƌlƏet ».
   * Le PDF reste valide, le défaut n'apparaît qu'à l'écran — d'où le piège.
   */
  const ttf = await readFile(
    path.join(process.cwd(), "public", "fonts", "PatrickHand-Regular.ttf"),
  );

  /**
   * Ligatures désactivées, et ce n'est pas un détail esthétique.
   *
   * Patrick Hand ligature « ll » : fontkit encode alors un glyphe unique dont
   * l'avance est mal reportée dans le PDF, et « mille » s'affiche « mill e »,
   * « Juillet » devient « Juill et ». Tout mot contenant « ll » est touché.
   *
   * Mesuré : sans l'option, la largeur de « mille » vaut 29,5 pt contre 31,2 pt
   * pour la somme de ses lettres — l'écart de 1,7 pt est exactement le trou
   * qu'on voit à l'écran.
   */
  const main = await doc.embedFont(ttf, {
    features: { liga: false, clig: false, dlig: false, rlig: false },
  });

  const page = doc.addPage([L, H]);
  page.drawRectangle({ x: 0, y: 0, width: L, height: H, color: FOND });

  // Double cadre : filet épais externe, filet fin interne — la signature
  // visuelle des carnets à souches.
  page.drawSvgPath(cheminRectArrondi(MARGE, MARGE, L - 2 * MARGE, H - 2 * MARGE, 10), {
    borderColor: NAVY,
    borderWidth: 2,
    y: H,
    scale: 1,
  });
  page.drawSvgPath(cheminRectArrondi(MARGE + 5, MARGE + 5, L - 2 * MARGE - 10, H - 2 * MARGE - 10, 7), {
    borderColor: NAVY,
    borderWidth: 0.6,
    borderOpacity: 0.5,
    y: H,
    scale: 1,
  });

  const G = MARGE + 20; // bord gauche du contenu
  const D = L - MARGE - 20; // bord droit
  let y = H - MARGE - 34;

  /* ------------------------------------------------------------- en-tête */

  // Le logo de la marque. Sa hauteur est fixée et la largeur en découle, pour
  // qu'un fichier non carré ne soit pas déformé.
  try {
    const png = await doc.embedPng(
      await readFile(path.join(process.cwd(), "public", "marque", "logo.png")),
    );
    // Le logo est calé sur la hauteur du bloc de titre, pour équilibrer le nom
    // de la marque plutôt que de flotter à côté.
    const hLogo = 88;
    const lLogo = (png.width / png.height) * hLogo;
    page.drawImage(png, { x: G, y: y - 58, width: lLogo, height: hLogo });
  } catch {
    // Sans logo, l'en-tête tient debout : ce n'est pas une raison d'échouer.
  }

  // Nom, sous-titre et téléphone centrés sur la largeur utile.
  const centre = (t: string, police: PDFFont, taille: number, yy: number, couleur = NAVY) => {
    const texte = ansi(t);
    page.drawText(texte, {
      x: (L - police.widthOfTextAtSize(texte, taille)) / 2,
      y: yy,
      size: taille,
      font: police,
      color: couleur,
    });
  };

  centre(data.marque, serifGras, 26, y - 4);
  centre(data.sousTitre, serif, 11.5, y - 20);
  // Le bailleur n'a pas toujours de téléphone enregistré : plutôt qu'un
  // « Tél. : — » qui fait négligé, la ligne s'efface.
  if (data.telSociete) centre(`Tél. : ${data.telSociete}`, sans, 9.5, y - 34);

  y -= 48;
  page.drawLine({
    start: { x: G, y },
    end: { x: D, y },
    thickness: 1.8,
    color: NAVY,
  });

  /* -------------------------------------------------------- bandeau titre */

  y -= 24;
  const titre = "QUITTANCE DE LOYER";
  page.drawText(titre, { x: G, y, size: 17, font: serifGras, color: NAVY });

  // Le « N° » suit le titre — position CALCULÉE, jamais devinée.
  const apresTitre = G + serifGras.widthOfTextAtSize(titre, 17) + 14;
  page.drawText("N°", { x: apresTitre, y: y + 1, size: 11, font: serifGras, color: ROUGE });
  const apresNo = apresTitre + serifGras.widthOfTextAtSize("N°", 11) + 5;
  page.drawText(ansi(data.numero), {
    x: apresNo,
    y,
    size: 14,
    font: main,
    color: ROUGE,
  });

  // Le groupe « Montant # … F CFA # » est ancré à DROITE : on mesure l'ensemble
  // avant de poser, sinon un montant long recouvrirait le numéro.
  const labelMontant = "Montant ";
  const valeurMontant = ansi(`# ${data.montantChiffres} F CFA #`);
  const largeurGroupe =
    serifGras.widthOfTextAtSize(labelMontant, 11) + main.widthOfTextAtSize(valeurMontant, 16);
  const xGroupe = Math.max(apresNo + main.widthOfTextAtSize(ansi(data.numero), 14) + 16, D - largeurGroupe);

  page.drawText(labelMontant, { x: xGroupe, y: y + 1, size: 11, font: serifGras, color: NAVY });
  page.drawText(valeurMontant, {
    x: xGroupe + serifGras.widthOfTextAtSize(labelMontant, 11),
    y,
    size: 16,
    font: main,
    color: ENCRE,
  });

  y -= 10;
  page.drawLine({ start: { x: G, y }, end: { x: D, y }, thickness: 0.6, color: NAVY, opacity: 0.5 });

  /* ------------------------------------------------------------- les champs */

  const hautChamps = y;
  const PAS = 30;
  y -= 30;

  // Le bailleur en tête des champs : c'est lui le créancier, la marque n'est
  // que l'éditeur du document.
  drawField({ page, y, label: "Bailleur :", value: data.bailleur, labelX: G, xEnd: D, printFont: serif, handFont: main, valueSize: 15 });

  y -= PAS;
  drawField({ page, y, label: "Locataire :", value: data.locataire, labelX: G, xEnd: D, printFont: serif, handFont: main });

  // « Francs » est ancré à droite : le champ s'arrête avant lui.
  y -= PAS;
  const motFrancs = "Francs";
  const xFrancs = D - serif.widthOfTextAtSize(motFrancs, 11);
  page.drawText(motFrancs, { x: xFrancs, y, size: 11, font: serif, color: NAVY });
  drawField({
    page, y, label: "Reçu la somme de :", value: data.sommeLettres,
    labelX: G, xEnd: xFrancs - 8, printFont: serif, handFont: main, valueSize: 15,
  });

  y -= PAS;
  drawField({ page, y, label: "Pour le loyer du mois de :", value: data.periode, labelX: G, xEnd: D, printFont: serif, handFont: main });

  // Deux champs sur une même ligne : c'est `xEnd` qui les sépare.
  y -= PAS;
  const milieu = G + (D - G) * 0.62;
  drawField({ page, y, label: "Résidence :", value: data.residence, labelX: G, xEnd: milieu - 12, printFont: serif, handFont: main, valueSize: 15 });
  drawField({ page, y, label: "N° Chbre :", value: data.chambre, labelX: milieu, xEnd: D, printFont: serif, handFont: main, valueSize: 15 });

  y -= PAS;
  drawField({ page, y, label: "Adresse :", value: data.adresse, labelX: G, xEnd: D, printFont: serif, handFont: main, valueSize: 14 });

  // Le téléphone est celui du LOCATAIRE : sur un quittancier, il sert à le
  // joindre en cas de litige sur le paiement.
  y -= PAS;
  drawField({ page, y, label: "Tél. :", value: data.telLocataire, labelX: G, xEnd: milieu - 12, printFont: serif, handFont: main, valueSize: 15 });
  drawField({ page, y, label: "Moyen de paiement :", value: data.moyenPaiement, labelX: milieu, xEnd: D, printFont: serif, handFont: main, valueSize: 15 });

  y -= PAS;
  drawField({ page, y, label: "Date :", value: data.date, labelX: G, xEnd: milieu - 12, printFont: serif, handFont: main, valueSize: 15 });

  const basChamps = y;

  /* ----------------------------------------------------------- le tampon */

  // Centré sur le bloc de champs, et mesuré : sans ça, il dépasse du cadre.
  const tampon = "100% recouvrement de loyer";
  const tailleTampon = 20;
  const largeurTampon = serifGras.widthOfTextAtSize(tampon, tailleTampon);
  page.drawText(tampon, {
    x: (L - largeurTampon * 0.93) / 2,
    y: (hautChamps + basChamps) / 2 - 14,
    size: tailleTampon,
    font: serifGras,
    color: rgb(0.25, 0.4, 0.8),
    opacity: 0.22,
    rotate: degrees(22),
  });

  /* -------------------------------------------------------- les signatures */

  const ySign = MARGE + 46;
  page.drawText("Locataire", { x: G, y: ySign, size: 10, font: serif, color: NAVY });

  const libelleBailleur = "Le Bailleur / Superviseur";
  const xBailleur = D - serif.widthOfTextAtSize(libelleBailleur, 10);
  page.drawText(libelleBailleur, { x: xBailleur, y: ySign, size: 10, font: serif, color: NAVY });

  // Le paraphe : une courbe de Bézier, posée au-dessus du libellé.
  page.drawSvgPath("M 0 0 C 14 -16, 30 12, 46 -6 C 56 -17, 62 4, 74 -8", {
    x: xBailleur + 4,
    y: ySign + 26,
    borderColor: ENCRE,
    borderWidth: 1.3,
    scale: 1,
  });
  page.drawText(ansi(data.signataire), {
    x: xBailleur + 6,
    y: ySign + 12,
    size: 13,
    font: main,
    color: ENCRE,
  });

  /* ------------------------------------------------------------ pied de page */

  centre("Spécialiste de la gestion locative", serif, 10, MARGE + 24, NAVY);
  centre(
    "Quittance délivrée gratuitement au locataire. Elle vaut preuve de paiement du loyer de la période indiquée.",
    sans,
    6.5,
    MARGE + 12,
    GRIS,
  );

  return doc.save();
}
