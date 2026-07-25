import { Hero } from "@/components/landing/Hero";
import { AboutUs } from "@/components/landing/AboutUs";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutUs />
      <Services />
      <HowItWorks />
      <Features />
      <Pricing />
      <FAQ />
    </>
  );
}
