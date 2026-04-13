"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "./stat-card";
import { BalanceCard } from "./balance-card";
import { RecentDonations } from "./recent-donations";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function DashboardClient() {
  const { user, firestoreUser } = useAuth();
  const [stats, setStats] = useState({
    totalDonated: 0,
    charitiesSupported: 0,
    donationCount: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Reconcile stale /pay/send donation statuses before aggregating,
      // best-effort so a Locus hiccup doesn't block the dashboard.
      try {
        const token = await user.getIdToken();
        await fetch("/api/donations/reconcile", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* ignore */
      }

      try {
        const q = query(
          collection(db, "donations"),
          where("donorId", "==", user.uid),
          where("status", "in", ["CONFIRMED", "QUEUED"]),
        );
        const snapshot = await getDocs(q);

        let total = 0;
        const charityIds = new Set<string>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          total += data.amount || 0;
          if (data.charityId) charityIds.add(data.charityId);
        });

        setStats({
          totalDonated: total,
          charitiesSupported: charityIds.size,
          donationCount: snapshot.size,
        });
      } catch {
        /* stats may fail due to missing index — that's ok */
      }
    };

    fetchStats();
  }, [user]);

  const firstName = firestoreUser?.displayName?.split(" ")[0] || "there";

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-10">
      <header>
        <h1 className="type-display-xl text-foreground">
          Hello, <span className="font-editorial">{firstName}</span>.
        </h1>
        <p className="mt-2 type-body-lg text-muted-foreground">
          Your giving overview.
        </p>
      </header>

      {/*
        Responsive row:
        - Below xl: stack vertically (balance card full width, then stats in a
          2-col grid below).
        - xl and up: 2-col layout (40/60 split) with 3-col stat grid inside.
        `min-w-0` on every grid child so long content (balance number, wallet
        address) can never force horizontal scroll.
      */}
      <section className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <div className="min-w-0">
          <BalanceCard />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total donated"
            value={`$${stats.totalDonated.toFixed(2)}`}
            subtitle="USDC on Base"
            index={0}
          />
          <StatCard
            title="Charities"
            value={String(stats.charitiesSupported)}
            subtitle="supported"
            index={1}
          />
          <StatCard
            title="Donations"
            value={String(stats.donationCount)}
            subtitle="on-chain"
            index={2}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="mb-4 type-heading text-foreground">Quick actions</h3>
        <div className="border border-border bg-card">
          <Link
            href="/chat"
            className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <div className="type-subheading text-foreground">
                Chat with the{" "}
                <span className="font-editorial">giving agent</span>
              </div>
              <div className="mt-1 type-body-sm text-muted-foreground">
                Describe what you care about — the agent finds matching
                charities, explains its reasoning, and executes donations.
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
          <Link
            href="/charities"
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <div className="type-subheading text-foreground">
                Browse charities
              </div>
              <div className="mt-1 type-body-sm text-muted-foreground">
                Verified organizations, filterable by cause and region.
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </section>

      <RecentDonations />
    </div>
  );
}
