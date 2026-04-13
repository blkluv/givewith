"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BASESCAN_TX_URL } from "@/lib/constants";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Donation {
  id: string;
  charityName: string;
  amount: number;
  status: string;
  txHash?: string;
  createdAt: string;
}

export function RecentDonations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDonations = async () => {
      try {
        const q = query(
          collection(db, "donations"),
          where("donorId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5),
        );
        const snapshot = await getDocs(q);
        setDonations(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Donation[],
        );
      } catch {
        /* silently fail (may need composite index) */
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="type-heading text-foreground">
          Recent <span className="font-editorial">donations</span>
        </h3>
        <Link
          href="/donations"
          className="inline-flex items-center gap-1 type-caption link-lime"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse border border-border bg-secondary"
            />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center">
          <p className="type-body-sm text-muted-foreground">
            No donations yet. Start by chatting with the agent.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border bg-card">
          {donations.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="type-body-sm font-medium text-foreground">
                  {d.charityName}
                </p>
                <p className="type-caption text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="type-mono text-sm font-medium text-foreground">
                  ${d.amount.toFixed(2)}
                </span>
                {d.txHash ? (
                  <a
                    href={`${BASESCAN_TX_URL}/${d.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on BaseScan"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
