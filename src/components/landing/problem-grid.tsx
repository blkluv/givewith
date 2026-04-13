"use client";

import { motion } from "framer-motion";

const items = [
  {
    number: "01",
    title: "No more wondering where your money went.",
    body: "Every donation is a USDC transaction on Base. Click the BaseScan link — see exactly which wallet received the funds, and when.",
  },
  {
    number: "02",
    title: "No more analysis paralysis.",
    body: "Tell the agent what you care about. It searches verified charities, reads their missions, pulls impact data — then recommends, with reasoning.",
  },
  {
    number: "03",
    title: "No more scattered receipts.",
    body: "One dashboard. Every gift, every transaction hash, every cause — in one place, from $0.50 on up.",
  },
];

export function ProblemGrid() {
  return (
    <section className="border-b border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-3xl">
          <div className="type-caption text-muted-foreground">The problem</div>
          <h2 className="mt-4 type-display-xl text-foreground">
            Charitable giving is broken in <span className="font-editorial">three</span> familiar ways.
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.number}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-4 border-t border-border pt-6"
            >
              <div className="type-mono text-primary">{item.number}</div>
              <h3 className="type-display-lg text-foreground">
                {item.title}
              </h3>
              <p className="type-body text-muted-foreground">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
