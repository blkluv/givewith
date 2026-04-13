"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DonateSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full space-y-8 text-center"
      >
        <div>
          <div className="type-caption text-primary">Confirmed</div>
          <h1 className="mt-3 type-display-xl text-foreground">
            Your gift is <span className="font-editorial">on chain</span>.
          </h1>
          <p className="mt-4 type-body-lg text-muted-foreground">
            Thank you. The donation has been recorded and is verifiable on
            Base.
          </p>
        </div>

        <div className="border border-border bg-card p-6 text-left">
          <dl className="space-y-3 type-body-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-primary">Confirmed</dd>
            </div>
            {sessionId ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Session</dt>
                <dd className="type-mono text-xs text-foreground">
                  {sessionId.slice(0, 12)}…
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Verification</dt>
              <dd className="text-foreground">BaseScan (in donation history)</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/donations" className="flex-1">
            <Button
              variant="outline"
              className="h-11 w-full border-border bg-transparent"
            >
              View donations
            </Button>
          </Link>
          <Link href="/chat" className="flex-1">
            <Button className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Chat with agent
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
