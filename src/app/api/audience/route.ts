import { supabaseAnon } from "@/lib/supabase/anon";

/**
 * Collecte de la mesure d'audience : endpoint PUBLIC (le navigateur n'est pas
 * authentifié), donc paranoïaque — types fermés, longueurs plafonnées,
 * durées plausibles, et écriture via la clé publique soumise à RLS (la
 * politique n'autorise que l'insertion).
 */
export async function POST(requete: Request) {
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const { visite, chemin, evenement, detail, dureeMs } = (corps ?? {}) as Record<string, unknown>;

  if (
    typeof visite !== "string" ||
    !/^[0-9a-fA-F-]{8,64}$/.test(visite) ||
    typeof chemin !== "string" ||
    chemin.length < 1 ||
    chemin.length > 200 ||
    !chemin.startsWith("/") ||
    (evenement !== "page_vue" && evenement !== "clic" && evenement !== "temps")
  ) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (detail !== undefined && (typeof detail !== "string" || detail.length > 120)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (
    dureeMs !== undefined &&
    (typeof dureeMs !== "number" || dureeMs < 0 || dureeMs > 86400000)
  ) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const { error } = await supabaseAnon().from("evenement_audience").insert({
    visite_id: visite === "ephemere" ? "00000000-0000-0000-0000-000000000000" : visite,
    chemin,
    evenement,
    detail: typeof detail === "string" && detail ? detail : null,
    duree_ms: typeof dureeMs === "number" ? Math.round(dureeMs) : null,
  });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
