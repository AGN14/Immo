import { requireProprietaire } from "@/lib/auth/mock-session";
import { supabaseServer } from "@/lib/supabase/server";
import { methodeLabel, statutVersementLabel } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

const cellule = (valeur: string | number | null | undefined) => {
  const texte = String(valeur ?? "");
  return `"${texte.replaceAll('"', '""')}"`;
};

/** Export CSV (Excel FR) de tous les paiements du parc, du plus récent au plus ancien. */
export async function GET() {
  const { proprietaireId } = await requireProprietaire();

  const { data: paiements } = await supabaseServer()
    .from("paiement")
    .select(
      "id, periode, montant_fcfa, cree_le, versement_id, bail!inner(locataire!inner(nom), lot!inner(nom, bien!inner(nom)))",
    )
    .eq("bail.lot.bien.proprietaire_id", proprietaireId)
    .order("cree_le", { ascending: false });

  if (!paiements) return new Response("", { status: 500 });

  const versementIds = [...new Set(paiements.map((p) => p.versement_id))];
  const [versements, quittances] = await Promise.all([
    versementIds.length > 0
      ? supabaseServer().from("versement").select("*").in("id", versementIds)
      : Promise.resolve({ data: null as null }),
    supabaseServer()
      .from("quittance")
      .select("numero, paiement_id")
      .in("paiement_id", paiements.map((p) => p.id)),
  ]);

  const versementParId = new Map(versements.data?.map((v) => [v.id, v]) ?? []);
  const quittanceParPaiement = new Map(
    quittances.data?.map((q) => [q.paiement_id, q.numero] as const) ?? [],
  );

  const lignes = paiements.map((p) => {
    const versement = versementParId.get(p.versement_id);
    const bail = p.bail as {
      locataire: { nom: string };
      lot: { nom: string; bien: { nom: string } };
    };
    return [
      new Date(p.cree_le).toLocaleString("fr-FR"),
      p.periode,
      bail.locataire.nom,
      bail.lot.bien.nom,
      bail.lot.nom,
      p.montant_fcfa,
      versement ? methodeLabel[versement.methode as keyof typeof methodeLabel] : "",
      versement ? statutVersementLabel[versement.statut as keyof typeof statutVersementLabel].label : "",
      quittanceParPaiement.get(p.id) ?? "",
    ]
      .map(cellule)
      .join(";");
  });

  const csv = [
    "\uFEFFDate;Période;Locataire;Bien;Logement;Montant (FCFA);Moyen de paiement;Statut du versement;Quittance",
    ...lignes,
  ].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="loyers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
