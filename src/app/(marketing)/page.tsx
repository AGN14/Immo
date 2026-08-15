import { FeatureTracks } from "@/components/marketing/FeatureTracks";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { StatsSection } from "@/components/marketing/StatsSection";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Reveal } from "@/components/ui/Reveal";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <StatsSection />
      {/* L'animation au scroll ne porte que deux blocs : le texte du reste
          de la page est lisible sans attendre le JS. */}
      <Reveal>
        <FeatureTracks />
      </Reveal>
      <HowItWorks />
      <Testimonials />
      <Reveal>
        <Pricing />
      </Reveal>
      <FinalCta />
    </>
  );
}
