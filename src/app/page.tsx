import dynamic from "next/dynamic";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomDock } from "@/components/layout/MobileBottomDock";
import { Footer } from "@/components/layout/Footer";
import { PageShellEffects } from "@/components/layout/PageShellEffects";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustStrip } from "@/components/sections/TrustStrip";

const CapabilitiesGrid = dynamic(() =>
  import("@/components/sections/CapabilitiesGrid").then(
    (mod) => mod.CapabilitiesGrid
  )
);
const BeforeAfterSection = dynamic(() =>
  import("@/components/sections/BeforeAfterSection").then(
    (mod) => mod.BeforeAfterSection
  )
);
const PricingCalculator = dynamic(() =>
  import("@/components/sections/PricingCalculator").then(
    (mod) => mod.PricingCalculator
  )
);
const DemoBookingForm = dynamic(() =>
  import("@/components/sections/DemoBookingForm").then(
    (mod) => mod.DemoBookingForm
  )
);

export default function SpanrailLandingPage() {
  return (
    <div className="relative isolate min-h-dvh">
      <PageShellEffects />
      <TopNav />

      <main id="main-content" className="relative z-10">
        <HeroSection />
        <TrustStrip />
        <CapabilitiesGrid />
        <BeforeAfterSection />
        <PricingCalculator />
        <DemoBookingForm />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileBottomDock />
    </div>
  );
}