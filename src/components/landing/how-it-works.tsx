"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Ask",
    body: "Tell the agent what you care about — clean water in Southeast Asia, maternal health, climate, anything.",
  },
  {
    n: "02",
    title: "Discover",
    body: "The agent searches verified charities in our directory. If nothing fits, it searches the web and evaluates new ones.",
  },
  {
    n: "03",
    title: "Verify",
    body: "It reads missions, checks overhead ratios, pulls impact data — and explains its reasoning before recommending.",
  },
  {
    n: "04",
    title: "Give",
    body: "Confirm the donation. USDC moves on Base in seconds. You get a BaseScan link that proves the gift arrived.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="border-b border-border px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-3xl">
          <div className="type-caption text-muted-foreground">How it works</div>
          <h2 className="mt-4 type-display-xl text-foreground">
            Ask. Discover. Verify. <span className="font-editorial">Give.</span>
          </h2>
          <p className="mt-4 type-body-lg text-muted-foreground">
            Four steps. The agent does the research. The blockchain does the
            proof.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-3 border-t border-primary pt-5"
            >
              <div className="type-mono text-primary">{step.n}</div>
              <h3 className="font-editorial text-2xl text-foreground">
                {step.title}
              </h3>
              <p className="type-body-sm text-muted-foreground">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
