"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, RefreshCw, Copy } from "lucide-react";
import { BASESCAN_ADDRESS_URL } from "@/lib/constants";
import { toast } from "sonner";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function BalanceCard() {
  const { firestoreUser, walletBalance, balanceLoading, refreshBalance } =
    useAuth();

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const copyAddress = () => {
    if (firestoreUser?.locusWalletAddress) {
      navigator.clipboard.writeText(firestoreUser.locusWalletAddress);
      toast.success("Wallet address copied");
    }
  };

  return (
    <div
      className="flex min-w-0 flex-col overflow-hidden border p-5 sm:p-6"
      style={{
        backgroundColor: "var(--color-cream)",
        color: "#0f0f10",
        borderColor: "var(--color-cream)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="type-caption" style={{ color: "#0f0f1099" }}>
          Wallet balance
        </span>
        <button
          type="button"
          onClick={refreshBalance}
          disabled={balanceLoading}
          aria-label="Refresh balance"
          className="transition-colors"
          style={{ color: "#0f0f1099" }}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="type-mono text-3xl font-medium leading-none sm:text-4xl">
          ${walletBalance ? Number(walletBalance).toFixed(2) : "0.00"}
        </span>
        <span className="type-caption" style={{ color: "#0f0f1099" }}>
          USDC
        </span>
      </div>

      {firestoreUser?.locusWalletAddress ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <code
              className="min-w-0 flex-1 truncate font-mono text-xs"
              style={{ color: "#0f0f10cc" }}
              title={firestoreUser.locusWalletAddress}
            >
              <span className="sm:hidden">
                {shortAddr(firestoreUser.locusWalletAddress)}
              </span>
              <span className="hidden sm:inline">
                {firestoreUser.locusWalletAddress}
              </span>
            </code>
            <button
              type="button"
              onClick={copyAddress}
              aria-label="Copy wallet address"
              className="shrink-0"
              style={{ color: "#0f0f10" }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {firestoreUser.locusClaimUrl ? (
              <a
                href={firestoreUser.locusClaimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 type-caption"
                style={{ borderColor: "#0f0f10", color: "#0f0f10" }}
              >
                Fund <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            <a
              href={`${BASESCAN_ADDRESS_URL}/${firestoreUser.locusWalletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 type-caption"
              style={{ color: "#0f0f1099" }}
            >
              BaseScan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
