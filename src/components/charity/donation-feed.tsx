"use client";

import { useEffect, useState } from "react";
import { BASESCAN_TX_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

interface Donation {
  id: string;
  amount: number;
  txHash?: string;
  status: string;
  createdAt: string;
}

interface DonationFeedProps {
  charityId: string;
}

export function DonationFeed({ charityId }: DonationFeedProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await fetch(`/api/charities/${charityId}/donations`);
        const data = await res.json();
        setDonations(data.donations || []);
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, [charityId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="border border-dashed border-border py-10 text-center">
        <p className="type-body-sm text-muted-foreground">
          No donations yet. Be the first.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border bg-card">
      {donations.map((donation) => (
        <li
          key={donation.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-baseline gap-3">
            <span className="type-mono text-sm font-medium text-foreground">
              ${donation.amount.toFixed(2)}
            </span>
            <span className="type-body-sm text-muted-foreground">
              {new Date(donation.createdAt).toLocaleDateString()}
            </span>
          </div>
          {donation.txHash ? (
            <a
              href={`${BASESCAN_TX_URL}/${donation.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs link-lime"
            >
              {donation.txHash.slice(0, 6)}…{donation.txHash.slice(-4)}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
