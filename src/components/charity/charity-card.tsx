"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CauseBadge } from "./cause-badge";
import { CharityImage } from "./charity-image";
import type { CharityCause } from "@/lib/constants";

export interface CharityData {
  id: string;
  name: string;
  mission: string;
  causes: CharityCause[];
  region: string;
  overheadRatio: number;
  impactScore: number;
  website: string;
  fundingGoal: number;
  fundingRaised: number;
  locusWalletAddress?: string;
  verified?: boolean;
}

interface CharityCardProps {
  charity: CharityData;
}

export function CharityCard({ charity }: CharityCardProps) {
  const percentage = Math.min(
    (charity.fundingRaised / charity.fundingGoal) * 100,
    100,
  );

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/charities/${charity.id}`}
        className="group block border border-border bg-card transition-colors hover:border-primary"
      >
        {/* Full-bleed hero image with location pill */}
        <div className="relative">
          <CharityImage name={charity.name} aspect="3/2" />
          <span className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 type-caption text-white backdrop-blur-sm">
            {charity.region}
          </span>
          {charity.verified ? (
            <span className="absolute top-3 right-3 bg-primary/95 px-2 py-1 type-caption text-primary-foreground">
              Verified
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 type-subheading text-foreground">
            {charity.name}
          </h3>

          <p className="line-clamp-2 type-body-sm text-muted-foreground">
            {charity.mission}
          </p>

          <div className="flex flex-wrap gap-1">
            {charity.causes.slice(0, 3).map((cause) => (
              <CauseBadge key={cause} cause={cause} />
            ))}
          </div>

          {/* Lime progress bar */}
          <div className="relative h-[3px] w-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Raised + count microcopy */}
          <div className="flex items-baseline justify-between">
            <span className="type-body-sm font-medium text-foreground">
              ${charity.fundingRaised.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
              <span className="type-caption text-muted-foreground">raised</span>
            </span>
            <span className="type-caption text-muted-foreground">
              On-chain
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
