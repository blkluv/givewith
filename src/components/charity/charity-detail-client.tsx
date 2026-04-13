"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CauseBadge } from "./cause-badge";
import { ImpactScore } from "./impact-score";
import { FundingProgress } from "./funding-progress";
import { DonationFeed } from "./donation-feed";
import { CharityImage } from "./charity-image";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  MapPin,
  Shield,
} from "lucide-react";
import { BASESCAN_ADDRESS_URL } from "@/lib/constants";
import type { CharityCause } from "@/lib/constants";

interface CharityDetailProps {
  charity: {
    id: string;
    name: string;
    mission: string;
    causes: CharityCause[];
    region: string;
    overheadRatio: number;
    impactScore: number;
    website: string;
    contactEmail: string;
    fundingGoal: number;
    fundingRaised: number;
    locusWalletAddress: string;
    verified: boolean;
  };
}

export function CharityDetailClient({ charity }: CharityDetailProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <Link
        href="/charities"
        className="inline-flex items-center gap-2 type-body-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to directory
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-8 lg:grid-cols-[5fr_3fr]"
      >
        {/* Hero image + info */}
        <div className="space-y-6">
          <div className="relative border border-border">
            <CharityImage name={charity.name} aspect="16/9" priority />
            <span className="absolute bottom-4 left-4 bg-black/60 px-2.5 py-1 type-caption text-white backdrop-blur-sm">
              <MapPin className="mr-1 inline h-3 w-3" />
              {charity.region}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="type-display-xl text-foreground">
                {charity.name}
              </h1>
              {charity.verified ? (
                <Shield className="h-6 w-6 text-primary" />
              ) : null}
            </div>
            <p className="type-body-lg text-muted-foreground">
              {charity.mission}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {charity.causes.map((cause) => (
                <CauseBadge key={cause} cause={cause} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </Button>
              </a>
              <a
                href={`${BASESCAN_ADDRESS_URL}/${charity.locusWalletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-border"
                >
                  <ExternalLink className="h-4 w-4" />
                  On-chain wallet
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar: stats + donate */}
        <aside className="space-y-4">
          <div className="border border-border bg-card p-6">
            <div className="space-y-5">
              <div>
                <div className="type-caption text-muted-foreground">
                  Funding
                </div>
                <div className="mt-2">
                  <FundingProgress
                    raised={charity.fundingRaised}
                    goal={charity.fundingGoal}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
                <div>
                  <div className="type-caption text-muted-foreground">
                    Overhead
                  </div>
                  <div className="type-mono mt-1 text-lg text-foreground">
                    {(charity.overheadRatio * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <ImpactScore score={charity.impactScore} size="md" />
                </div>
              </div>
            </div>
            <Link
              href={`/donate/${charity.id}`}
              className="mt-6 block"
            >
              <Button className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Donate
              </Button>
            </Link>
          </div>

          <p className="type-body-sm text-muted-foreground">
            Every donation is a USDC transaction on Base. You&apos;ll get a
            BaseScan link in your receipt.
          </p>
        </aside>
      </motion.div>

      {/* Donation feed */}
      <section>
        <h2 className="mb-4 type-heading text-foreground">
          Recent <span className="font-editorial">on-chain</span> donations
        </h2>
        <DonationFeed charityId={charity.id} />
      </section>
    </div>
  );
}
