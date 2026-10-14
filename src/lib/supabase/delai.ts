/**
 * Délai de grâce pour les appels d'authentification.
 *
 * Quand Supabase ne répond plus (serveur injoignable, comme un VPS éteint),
 * `getUser()` n'échoue pas vite : la connexion pend jusqu'au timeout TCP, et
 * chaque page attend — le site paraît « très lent » au lieu d'afficher une
 * erreur franche. Ce garde-fou tranche au bout de quelques secondes et rend
 * une valeur de repli : déconnecté plutôt que pendu.
 *
 * Fonctions pures, sans API Node : importé par le proxy (runtime edge) comme
 * par la session (serveur). Ne pas y ajouter `server-only`.
 */
/**
 * Plafonne n'importe quelle requête : au-delà du délai, `null` plutôt qu'une
 * page pendue. Sert les lectures publiques (grille tarifaire) qui doivent
 * s'afficher même quand la base tousse — avec des valeurs de repli.
 */
export async function avecDelai<T>(promesse: Promise<T>, ms = 3000): Promise<T | null> {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promesse,
      new Promise<never>((_, rejeter) => {
        minuteur = setTimeout(() => rejeter(new Error("delai-requete")), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (minuteur !== undefined) clearTimeout(minuteur);
  }
}

export async function utilisateurAvecDelai(
  client: {
    auth: { getUser: () => Promise<{ data: { user: { id: string; email?: string } | null } }> };
  },
  ms = 4000,
): Promise<{ id: string; email?: string } | null> {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  try {
    const resultat = await Promise.race([
      client.auth.getUser(),
      new Promise<never>((_, rejeter) => {
        minuteur = setTimeout(() => rejeter(new Error("delai-auth")), ms);
      }),
    ]);
    return resultat.data.user ?? null;
  } catch {
    return null;
  } finally {
    if (minuteur !== undefined) clearTimeout(minuteur);
  }
}
