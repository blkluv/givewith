"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CharityCard, type CharityData } from "@/components/charity/charity-card";
import { ArrowRight } from "lucide-react";

export function FeaturedCharities() {
  const [charities, setCharities] = useState<CharityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const res = await fetch("/api/charities?sort=impactScore");
        const data = await res.json();
        setCharities((data.charities || []).slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured charities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCharities();
  }, []);

  return (
    <section className="border-b border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="type-caption text-muted-foreground">
              Verified charities
            </div>
            <h2 className="mt-4 type-display-xl text-foreground">
              Hand-picked. <span className="font-editorial">On-chain.</span>
            </h2>
            <p className="mt-3 type-body-lg text-muted-foreground">
              Six verified organizations ready to receive USDC. Each has a
              wallet, an impact score, and a transparent overhead ratio.
            </p>
          </div>
          <Link
            href="/charities"
            className="inline-flex items-center gap-2 type-caption link-lime"
          >
            See all charities
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[360px] animate-pulse border border-border bg-secondary"
              />
            ))}
          </div>
        ) : charities.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="type-body text-muted-foreground">
              No charities loaded yet.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {charities.map((charity) => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
