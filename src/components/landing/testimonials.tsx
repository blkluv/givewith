"use client";

import { motion } from "framer-motion";

const quotes = [
  {
    body: "Finally, a giving platform that doesn't make me wonder if my $5 actually got there. The BaseScan link is the whole point.",
    author: "Dreke",
    context: "Climate donor",
  },
  {
    body: "I told the agent I cared about maternal health in Sub-Saharan Africa. Two minutes later it had two vetted options with impact data and overhead ratios. I just confirmed.",
    author: "Wezabis",
    context: "Healthcare donor",
  },
  {
    body: "The agent found a mangrove-restoration nonprofit in Indonesia that wasn't even on the platform. It emailed them $0.50 to claim. That's the flywheel.",
    author: "Drizzy",
    context: "Environment donor",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-3xl">
          <div className="type-caption text-muted-foreground">What it feels like</div>
          <h2 className="mt-4 type-display-xl text-foreground">
            Clarity you <span className="font-editorial">can&apos;t fake</span>.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {quotes.map((q, i) => (
            <motion.figure
              key={q.author}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col justify-between gap-6 border border-border bg-card p-6"
            >
              <blockquote className="font-editorial text-xl leading-relaxed text-foreground">
                &ldquo;{q.body}&rdquo;
              </blockquote>
              <figcaption>
                <div className="type-subheading text-foreground">
                  {q.author}
                </div>
                <div className="type-caption text-muted-foreground">
                  {q.context}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
