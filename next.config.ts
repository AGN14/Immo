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
   * La raison d'origine — la base sur un poste, le front sur l'autre — a
   * disparu avec le passage au cloud. L'autorisation reste, pour une meilleure
   * raison : ouvrir le site depuis un vrai téléphone. Xwégán se paie par Mobile
   * Money, et le widget KKiaPay, le clavier numérique et la lecture des
   * montants ne se jugent pas dans un simulateur de navigateur.
   *
   * Les deux plages retenues sont privées au sens du RFC 1918, donc
   * injoignables depuis Internet : 192.168.x.x pour une box ou un partage de
   * connexion, 10.x.x.x pour un réseau d'école ou d'entreprise. `192.168.1.*`
   * seul ne suffisait pas : en partage de connexion Android, le téléphone
   * distribue du 192.168.43.x, et rien ne se chargeait.
   *
   * Pourquoi ne pas tout autoriser avec `*` : ce serveur sert le code source et
   * ses source maps. Avec `*`, n'importe quel site ouvert dans un onglet
   * pendant que `next dev` tourne pourrait les lire depuis le navigateur. La
   * liste dit « les appareils de mon réseau », pas « le web entier ».
   *
   * Ne concerne que `next dev` ; la production n'est pas affectée.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.*.*", "10.*.*.*"],

  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost }]
      : [],
  },
};

export default nextConfig;
