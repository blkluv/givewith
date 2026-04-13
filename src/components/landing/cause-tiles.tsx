"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  HandHeart,
  Heart,
  Thermometer,
  GraduationCap,
  Leaf,
  Baby,
  Apple,
  TrendingUp,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { CHARITY_CAUSES, CAUSE_LABELS, type CharityCause } from "@/lib/constants";

const iconMap: Record<CharityCause, LucideIcon> = {
  poverty: HandHeart,
  health: Heart,
  climate: Thermometer,
  education: GraduationCap,
  environment: Leaf,
  children: Baby,
  nutrition: Apple,
  "economic-empowerment": TrendingUp,
  biodiversity: Sprout,
};

export function CauseTiles() {
  return (
    <section className="border-b border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-3xl">
          <div className="type-caption text-muted-foreground">
            Browse by cause
          </div>
          <h2 className="mt-4 type-display-xl text-foreground">
            What <span className="font-editorial">moves</span> you?
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {CHARITY_CAUSES.map((cause, i) => {
            const Icon = iconMap[cause];
            return (
              <motion.div
                key={cause}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={`/charities?cause=${cause}`}
                  className="group flex aspect-square flex-col items-center justify-center border border-border bg-card p-4 text-center transition-colors hover:border-primary hover:bg-surface-hover"
                >
                  <Icon
                    className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary"
                    strokeWidth={1.4}
                  />
                  <span className="mt-3 type-body-sm text-foreground">
                    {CAUSE_LABELS[cause]}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
