import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireProprietaire } from "@/lib/auth/mock-session";
import { planSuffisant } from "@/lib/plans";
import {
  getBaux,
  getBiens,
  getLots,
  getPaiements,
  getVersements,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const encre = rgb(0.16, 0.16, 0.16);
const gris = rgb(0.48, 0.48, 0.48);
const accent = rgb(0.11, 0.36, 0.33);
const clair = rgb(0.92, 0.92, 0.92);

function formater(montant: number) {
  return `${montant.toLocaleString("fr-FR")} F`;
}

/** Bilan annuel du parc en PDF — réservé au plan Business. */
export async function GET(request: Request) {
  const { plan, proprietaireId } = await requireProprietaire();
  if (!planSuffisant(plan, "business"))
    return new Response("Plan Business requis.", { status: 403 });

  const url = new URL(request.url);
  const anneeParam = url.searchParams.get("annee") ?? "";

  const [biens, lots, baux, paiements, versements] = await Promise.all([
    getBiens(proprietaireId),
    getLots(proprietaireId),
    getBaux(proprietaireId),
    getPaiements(proprietaireId),
    getVersements(proprietaireId),
  ]);

  const annees = [
    ...new Set([
      ...paiements.map((p) => p.periode.slice(0, 4)),
      ...baux.map((b) => b.dateDebut.slice(0, 4)),
      new Date().getFullYear().toString(),
    ]),
  ]
    .filter(Boolean)
    .sort()
    .reverse();

  const annee = annees.includes(anneeParam) ? anneeParam : annees[0] ?? "2026";
  const prefixe = `${annee}-`;

  const versementConfirme = new Set(
    versements.filter((v) => v.statut === "confirme").map((v) => v.id),
  );
  const paiementsAnnee = paiements.filter((p) => p.periode.startsWith(prefixe));
  const encaisse = paiementsAnnee.filter((p) => versementConfirme.has(p.versementId));
  const totalEncaisseFcfa = encaisse.reduce((s, p) => s + p.montantFcfa, 0);
  const totalAttenduFcfa = paiementsAnnee.reduce((s, p) => s + p.montantFcfa, 0);
  const taux =
    totalAttenduFcfa === 0 ? null : Math.round((totalEncaisseFcfa / totalAttenduFcfa) * 100);
  const impotEstimatifFcfa = Math.round(totalEncaisseFcfa * 0.12);
  const bauxActifs = baux.filter((b) => b.statut === "actif");

  const lignesBien = biens
    .map((bien) => {
      const lotsDuBien = lots.filter((l) => l.bienId === bien.id);
      const bailIds = new Set(
        baux.filter((b) => lotsDuBien.some((l) => l.id === b.lotId)).map((b) => b.id),
      );
      const encaisseBien = encaisse
        .filter((p) => bailIds.has(p.bailId))
        .reduce((s, p) => s + p.montantFcfa, 0);
      return {
        nom: bien.nom,
        lots: lotsDuBien.length,
        loues: bauxActifs.filter((b) => lotsDuBien.some((l) => l.id === b.lotId)).length,
        encaisseFcfa: encaisseBien,
      };
    })
    .sort((a, b) => b.encaisseFcfa - a.encaisseFcfa);

  const doc = await PDFDocument.create();
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595.28, 841.89]);
  const marge = 52;
  let y = 841.89 - 56;
  // En-tête.
  page.drawRectangle({ x: 0, y: 841.89 - 10, width: 595.28, height: 10, color: accent });
  page.drawText(`Xwégán — Bilan annuel ${annee}`, {
    x: marge,
    y,
    size: 20,
    font: gras,
    color: encre,
  });
  y -= 22;
  page.drawText(`Parc de ${proprietaireId ? "votre activité locative" : ""}`.trim(), {
    x: marge,
    y,
    size: 10,
    font: police,
    color: gris,
  });
  y -= 20;

  // Synthèse.
  page.drawText("Synthèse", { x: marge, y, size: 13, font: gras, color: accent });
  y -= 18;
  const lignesSynthese = [
    ["Encaissé confirmé", formater(totalEncaisseFcfa)],
    ["Total déclaré", formater(totalAttenduFcfa)],
    ["Taux d'encaissement", taux === null ? "—" : `${taux} %`],
    ["Baux actifs", `${bauxActifs.length}`],
  ];
  for (const [label, valeur] of lignesSynthese) {
    page.drawText(label, { x: marge, y, size: 10, font: police, color: gris });
    page.drawText(valeur, { x: 320, y, size: 10, font: gras, color: encre });
    y -= 15;
  }

  y -= 10;

  // Détail par bien.
  page.drawText("Détail par bien", { x: marge, y, size: 13, font: gras, color: accent });
  y -= 18;
  const tete = ["Bien", "Lots", "Loués", "Encaissé"];
  const largeurs = [0, 120, 200, 260];
  for (let i = 0; i < tete.length; i++) {
    page.drawText(tete[i], { x: marge + largeurs[i], y, size: 9, font: gras, color: encre });
  }
  y -= 8;
  page.drawRectangle({ x: marge, y, width: 491, height: 1, color: clair });
  y -= 16;

  if (lignesBien.length === 0) {
    page.drawText("Aucun bien dans le parc.", { x: marge, y, size: 10, font: police, color: gris });
    y -= 16;
  } else {
    for (const ligne of lignesBien) {
      const nom = ligne.nom.length > 42 ? `${ligne.nom.slice(0, 40)}...` : ligne.nom;
      page.drawText(nom, { x: marge, y, size: 10, font: police, color: encre });
      page.drawText(`${ligne.lots}`, { x: marge + 120, y, size: 10, font: police, color: encre });
      page.drawText(`${ligne.loues}`, { x: marge + 200, y, size: 10, font: police, color: encre });
      page.drawText(formater(ligne.encaisseFcfa), {
        x: marge + 260,
        y,
        size: 10,
        font: gras,
        color: encre,
      });
      y -= 16;
      if (y < 120) {
        page = doc.addPage([595.28, 841.89]);
        y = 841.89 - 56;
      }
    }
  }

  y -= 14;

  // Note fiscale indicative.
  page.drawRectangle({ x: marge, y: y - 8, width: 491, height: 1, color: clair });
  y -= 24;
  page.drawText(`Impôt estimé sur les revenus fonciers (12 %) : ${formater(impotEstimatifFcfa)}`, {
    x: marge,
    y,
    size: 10,
    font: gras,
    color: encre,
  });
  y -= 16;
  page.drawText(
    "Estimation indicative selon le régime béninois. Consultez un conseiller fiscal avant toute déclaration.",
    { x: marge, y, size: 8, font: police, color: gris },
  );

  // Pied de page.
  page.drawText(`Édité le ${new Date().toLocaleDateString("fr-FR")} — Xwégán`, {
    x: marge,
    y: 40,
    size: 8,
    font: police,
    color: gris,
  });

  const bytes = await doc.save();
  return new Response(bytes as unknown as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bilan-${annee}.pdf"`,
    },
  });
}
