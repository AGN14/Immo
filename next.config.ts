import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Masque la pastille de développement Next.js en bas de page.
  // Les erreurs de compilation et d'exécution restent affichées.
  devIndicators: false,
};

export default nextConfig;
