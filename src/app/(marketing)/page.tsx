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
      {/* Le Hero reste hors animation : premier écran, il doit être visible
          sans attendre le JS ni le défilement. */}
      <Hero />
      {/* Cartes/étapes déjà animées individuellement (voir chaque composant) :
          un Reveal ici referait apparaître le bloc entier par-dessus, en double. */}
      <ProblemSection />
      <StatsSection />
      <Reveal>
        <FeatureTracks />
      </Reveal>
      <HowItWorks />
      <Reveal>
        <Testimonials />
      </Reveal>
      <Pricing />
      <Reveal>
        <FinalCta />
      </Reveal>
    </>
  );
}
