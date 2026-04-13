"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { ProblemGrid } from "@/components/landing/problem-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CauseTiles } from "@/components/landing/cause-tiles";
import { FeaturedCharities } from "@/components/landing/featured-charities";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main>
        <Hero />
        <ProblemGrid />
        <HowItWorks />
        <CauseTiles />
        <FeaturedCharities />
        <Testimonials />
        <Faq />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
