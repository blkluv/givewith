"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BasescanLink } from "./basescan-link";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Donation {
  id: string;
  charityName: string;
  amount: number;
  status: string;
  method: string;
  txHash?: string;
  agentReasoning?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  QUEUED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PENDING: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  PENDING_APPROVAL: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  FAILED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  EXPIRED: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

const STATUS_FILTERS = ["all", "CONFIRMED", "QUEUED", "FAILED"] as const;

export function DonationsClient() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    const fetchDonations = async () => {
      try {
        // Direct /pay/send donations don't emit webhooks, so statuses can be
        // stale (QUEUED forever). Reconcile against live Locus state first —
        // the updated docs land before we read them.
        try {
          const token = await user.getIdToken();
          await fetch("/api/donations/reconcile", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          /* reconcile is best-effort; still show whatever Firestore has */
        }

        const q = query(
          collection(db, "donations"),
          where("donorId", "==", user.uid),
          orderBy("createdAt", "desc"),
        );
        const snapshot = await getDocs(q);
        setDonations(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Donation[],
        );
      } catch {
        /* may fail due to missing composite index */
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user]);

  const filtered =
    statusFilter === "all"
      ? donations
      : donations.filter((d) => d.status === statusFilter);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="space-y-3">
        <h1 className="type-display-xl text-foreground">
          <span className="font-editorial">On-chain</span> receipts
        </h1>
        <p className="type-body-lg max-w-2xl text-muted-foreground">
          Every donation is a USDC transaction on Base. Verifiable. Immutable.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            className={cn(
              "border px-3 py-1.5 type-caption transition-colors",
              statusFilter === status
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse border border-border bg-secondary"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="type-body text-muted-foreground">
            {statusFilter === "all"
              ? "No donations yet. Start by chatting with the agent."
              : `No ${statusFilter} donations found.`}
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card">
          <div className="hidden border-b border-border px-5 py-3 type-caption text-muted-foreground md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:gap-4">
            <div>Charity</div>
            <div>Amount</div>
            <div>Method</div>
            <div>Status</div>
            <div>Tx</div>
            <div />
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((donation) => (
              <li
                key={donation.id}
                className="flex flex-col gap-3 px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate type-body-sm font-medium text-foreground">
                    {donation.charityName}
                  </p>
                  <p className="type-caption text-muted-foreground">
                    {new Date(donation.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="type-mono text-sm font-medium text-foreground">
                  ${donation.amount.toFixed(2)}
                </span>
                <span className="type-caption text-muted-foreground">
                  {donation.method}
                </span>
                <span
                  className={cn(
                    "inline-flex w-fit border px-2 py-0.5 type-caption",
                    STATUS_STYLES[donation.status] ||
                      "border-border text-muted-foreground",
                  )}
                >
                  {donation.status}
                </span>
                <div>
                  {donation.txHash ? (
                    <BasescanLink txHash={donation.txHash} />
                  ) : (
                    <span className="type-caption text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  {donation.agentReasoning ? (
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary"
                          >
                            <Lightbulb className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <PopoverContent className="w-80 border-border bg-card">
                        <h4 className="type-caption text-muted-foreground">
                          Agent reasoning
                        </h4>
                        <p className="mt-2 type-body-sm leading-relaxed text-foreground">
                          {donation.agentReasoning}
                        </p>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
