import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
    </>
  );
}
