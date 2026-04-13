"use client";

import { useState } from "react";
import { PRESET_AMOUNTS, MIN_DONATION_AMOUNT } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AmountSelectorProps {
  selectedAmount: number;
  onAmountChange: (amount: number) => void;
  balance: string | null;
}

export function AmountSelector({
  selectedAmount,
  onAmountChange,
  balance,
}: AmountSelectorProps) {
  const [customMode, setCustomMode] = useState(false);

  const parsedBalance = balance ? parseFloat(balance) : null;
  const insufficient =
    parsedBalance !== null && selectedAmount > parsedBalance;

  return (
    <div className="space-y-4">
      <div className="type-caption text-muted-foreground">
        Donation amount
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRESET_AMOUNTS.map((amount) => {
          const active = !customMode && selectedAmount === amount;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setCustomMode(false);
                onAmountChange(amount);
              }}
              className={cn(
                "h-12 border type-mono text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-foreground",
              )}
            >
              ${amount.toFixed(2)}
            </button>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          className="type-caption link-lime"
          onClick={() => setCustomMode(true)}
        >
          Enter custom amount
        </button>
        {customMode ? (
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min={MIN_DONATION_AMOUNT}
              value={selectedAmount}
              onChange={(e) =>
                onAmountChange(parseFloat(e.target.value) || 0)
              }
              className="w-full border border-border bg-card pl-7 pr-3 py-2.5 type-mono text-sm outline-none focus:border-primary"
            />
          </div>
        ) : null}
      </div>

      {parsedBalance !== null ? (
        <div
          className={cn(
            "flex items-center justify-between border px-3 py-2 type-body-sm",
            insufficient
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <span>Your balance</span>
          <span className="type-mono font-medium">
            ${parsedBalance.toFixed(2)} USDC
          </span>
        </div>
      ) : null}

      {insufficient ? (
        <p className="type-body-sm text-destructive">
          Insufficient balance. Fund your wallet to continue.
        </p>
      ) : null}
    </div>
  );
}
