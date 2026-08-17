import {
  Navbar,
  HeroSection,
  FeaturesSection,
  ProgramsSection,
  TestimonialsSection,
  StatsSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-arc-bg">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProgramsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
