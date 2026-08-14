import { FeatureTracks } from "@/components/marketing/FeatureTracks";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Footer } from "@/components/marketing/Footer";
import { Header } from "@/components/marketing/Header";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { StatsSection } from "@/components/marketing/StatsSection";
import { Testimonials } from "@/components/marketing/Testimonials";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <StatsSection />
        <ProblemSection />
        <FeatureTracks />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
