import type { NextConfig } from "next";

const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Masque la pastille de développement Next.js en bas de page.
  // Les erreurs de compilation et d'exécution restent affichées.
  devIndicators: false,

  /**
   * Hôtes autorisés à charger les ressources de développement (chunks, HMR).
   *
   * Sans ça, ouvrir l'app par l'IP de la machine plutôt que par `localhost`
   * renvoie une page qui s'affiche mais ne s'hydrate jamais : Next bloque les
   * scripts et le rechargement à chaud, sans erreur visible côté navigateur.
   *
   * On travaille à deux sur le même réseau — la base tourne sur un poste, le
   * front sur l'autre — donc le réseau local doit être admis. Cela ne concerne
   * que `next dev` ; la production n'est pas affectée.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.*"],

  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost }]
      : [],
  },
};

export default nextConfig;
