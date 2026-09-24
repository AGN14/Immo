/**
 * L'admin n'existe que sur son sous-domaine.
 *
 * `ADMIN_HOST=tower-admin-xwegan.xwegan.dev-teams.tech` : toute demande vers
 * /admin ou /api/admin* portant un autre hôte reçoit un 404 sec — pas de
 * redirection vers la connexion, qui avouerait l'existence de la page.
 *
 * Fonctions pures, sans API Node : ce module est importé par le proxy (qui
 * tourne en runtime edge) comme par les routes API. Ne pas y ajouter
 * `server-only`.
 */

/** Hôte demandeur normalisé : premier de la liste, minuscules, sans port. */
export function normaliserHote(brut: string | null | undefined): string {
  let hote = (brut ?? "").split(",")[0].trim().toLowerCase();
  if (hote.startsWith("[")) {
    // IPv6 entre crochets : [::1] ou [::1]:3001.
    const fin = hote.indexOf("]");
    hote = fin > 0 ? hote.slice(1, fin) : hote;
  } else if ((hote.match(/:/g) ?? []).length <= 1) {
    // Un seul « : » au plus : c'est un port à retirer, pas de l'IPv6.
    hote = hote.replace(/:\d+$/, "");
  }
  return hote;
}

/** Réseaux de développement : on ne casse jamais l'accès local. */
export function hoteEstLocal(hote: string): boolean {
  return (
    hote === "localhost" ||
    hote === "127.0.0.1" ||
    hote === "::1" ||
    hote.startsWith("192.168.") ||
    hote.startsWith("10.")
  );
}

/**
 * L'hôte demandeur peut-il voir l'admin ?
 * ADMIN_HOST vide = tout passe (compatibilité ascendante, le temps de configurer).
 */
export function hoteAdminAutorise(
  hoteDemande: string | null | undefined,
  hoteAdmin: string | null | undefined,
): boolean {
  const admin = (hoteAdmin ?? "").trim().toLowerCase();
  if (!admin) return true;
  const hote = normaliserHote(hoteDemande);
  return hote === admin || hoteEstLocal(hote);
}
