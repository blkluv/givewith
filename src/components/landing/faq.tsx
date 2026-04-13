"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQ = [
  {
    q: "Is my donation really on-chain?",
    a: "Yes. Every donation is a USDC transaction on Base, the Ethereum L2. You get a transaction hash immediately, clickable to BaseScan for independent verification. Nothing is held in a black box.",
  },
  {
    q: "What's the minimum donation?",
    a: "$0.50 USDC. This is a demo-era floor so you can test the full flow cheaply. It can be raised or lowered per deployment.",
  },
  {
    q: "Are these real charities?",
    a: "Yes — the directory is seeded with six real, globally-recognized organizations (GiveDirectly, Against Malaria Foundation, Helen Keller International, One Acre Fund, Rainforest Trust, Founders Pledge Climate Change Fund). Each has a real Locus wallet that we control for the hackathon demo; in production, charities would claim ownership themselves.",
  },
  {
    q: "How does the AI agent choose charities?",
    a: "It searches our verified database first, using cause and region filters. If nothing fits, it runs a web search (Brave) and scrapes candidate websites (Firecrawl) to pull mission + impact data. Every recommendation comes with the agent's reasoning shown alongside — no black-box scores.",
  },
  {
    q: "Can I get a tax receipt?",
    a: "The BaseScan transaction is an immutable public record of the transfer. For formal tax deductibility, you'd need documentation from the receiving charity (each real org issues their own). We don't yet issue consolidated tax receipts — that's on the roadmap.",
  },
  {
    q: "What if the charity I want isn't on the platform?",
    a: "The agent can invite them. It sends a $0.50 USDC escrow to their contact email via Locus — they get a link to claim the funds and auto-register as a charity on GiveWithLocus. That's the recruitment flywheel built into the product.",
  },
  {
    q: "How much does this cost the donor?",
    a: "Zero platform fees. You pay only the donation amount + negligible Base gas (a few cents, bundled by Locus). No middleman cut, no subscription.",
  },
  {
    q: "What is GiveWithLocus, technically?",
    a: "An AI chat interface that renders live interactive UI — not just text — on top of Locus payment infrastructure. Next.js frontend, Firebase for auth + Firestore, and every payment primitive (wallet creation, USDC transfers, email escrow, checkout) via Locus's Beta API on Base. Built for the Paygentic Hackathon.",
  },
];

export function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="border-b border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-3xl">
          <div className="type-caption text-muted-foreground">
            Frequently asked
          </div>
          <h2 className="mt-4 type-display-xl text-foreground">
            Questions,{" "}
            <span className="font-editorial">answered plainly</span>.
          </h2>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <p className="mb-8 type-body-lg text-muted-foreground lg:mb-0">
            Still have something we didn&apos;t cover? The agent can probably
            answer it directly — every starter prompt is open-ended.
          </p>

          <ul className="divide-y divide-border border-y border-border">
            {FAQ.map((item, i) => {
              const open = openIdx === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-primary"
                  >
                    <span className="type-subheading text-foreground">
                      {item.q}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {open ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-8 type-body text-muted-foreground">
                          {item.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
