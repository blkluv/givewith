"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { AgentDemo } from "./agent-demo";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border px-6 pb-24 pt-32 sm:pt-36">
      {/* Soft lime halo for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[60%] w-[60%] opacity-[0.08] blur-[120px]"
        style={{ background: "var(--color-lime)" }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[6fr_5fr]">
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="type-caption text-primary">
            AI-powered giving · On-chain proof
          </div>
          <h1 className="mt-6 type-brand-hero text-foreground">
            Give with intent.
          </h1>
          <p className="mt-6 max-w-xl type-body-lg text-muted-foreground">
            Chat with an agent that finds the right cause. Every donation is
            USDC on Base — traceable, verifiable, immutable. No more wondering
            where your money went.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="h-12 bg-primary px-8 text-primary-foreground hover:bg-primary/90">
                Start with $0.50
              </Button>
            </Link>
            <a href="#how">
              <Button
                variant="outline"
                className="h-12 gap-2 border-border bg-transparent px-8 text-foreground"
              >
                See how it works
                <ArrowDown className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Right — auto-playing agent demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <AgentDemo />
        </motion.div>
      </div>
    </section>
  );
}
