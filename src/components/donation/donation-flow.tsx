"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AmountSelector } from "./amount-selector";
import { CheckoutWrapper } from "./checkout-wrapper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type FlowState =
  | "selecting"
  | "creating"
  | "checkout"
  | "success"
  | "cancelled";

interface DonationFlowProps {
  charity: {
    id: string;
    name: string;
    mission: string;
    impactScore: number;
    overheadRatio: number;
  };
}

export function DonationFlow({ charity }: DonationFlowProps) {
  const router = useRouter();
  const { user, walletBalance, refreshBalance } = useAuth();
  const [state, setState] = useState<FlowState>("selecting");
  const [amount, setAmount] = useState(0.5);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const handleDonate = useCallback(async () => {
    if (!user) return;
    setState("creating");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          charityId: charity.id,
          amount: amount.toFixed(2),
          memo: `Donation to ${charity.name}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create checkout session");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setCheckoutUrl(data.checkoutUrl);
      setState("checkout");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create donation";
      toast.error(message);
      setState("selecting");
    }
  }, [user, charity.id, charity.name, amount]);

  if (state === "checkout" && sessionId) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <button
          type="button"
          onClick={() => setState("selecting")}
          className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Change amount
        </button>
        <div className="border border-border bg-card">
          <CheckoutWrapper
            sessionId={sessionId}
            checkoutUrl={checkoutUrl}
            onSuccess={() => {
              setState("success");
              router.push(`/donate/success?sessionId=${sessionId}`);
            }}
            onCancel={() => {
              setState("cancelled");
              router.push(`/donate/cancel?charityId=${charity.id}`);
            }}
            onError={(err) => {
              toast.error(err.message);
              setState("selecting");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={`/charities/${charity.id}`}
        className="inline-flex items-center gap-2 type-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {charity.name}
      </Link>

      <div className="border border-border bg-card p-6">
        <div className="mb-6 space-y-2">
          <h2 className="type-heading text-foreground">
            Donate to <span className="font-editorial">{charity.name}</span>
          </h2>
          <p className="type-body-sm text-muted-foreground">
            {charity.mission}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 type-caption text-muted-foreground">
            <span>Impact {charity.impactScore}</span>
            <span>Overhead {(charity.overheadRatio * 100).toFixed(0)}%</span>
          </div>
        </div>

        <AmountSelector
          selectedAmount={amount}
          onAmountChange={setAmount}
          balance={walletBalance}
        />

        <Button
          className="mt-6 h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={state === "creating" || amount < 0.5}
          onClick={handleDonate}
        >
          {state === "creating" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating checkout…
            </>
          ) : (
            `Donate $${amount.toFixed(2)} USDC`
          )}
        </Button>
      </div>
    </div>
  );
}
