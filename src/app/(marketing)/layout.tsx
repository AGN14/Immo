import { DefilementAncres } from "@/components/marketing/DefilementAncres";
import { Footer } from "@/components/marketing/Footer";
import { Header } from "@/components/marketing/Header";

/**
 * Chrome commun aux pages publiques. L'ancre #top vit ici : elle est visée
 * depuis le logo et doit exister sur toutes les pages du groupe.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DefilementAncres />
      <Header />
      <main id="top">{children}</main>
      <Footer />
    </>
  );
}
