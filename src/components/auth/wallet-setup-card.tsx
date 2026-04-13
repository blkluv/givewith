"use client";

import { useState } from "react";
import { Wallet, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RateLimitState {
  retryAfterSeconds: number;
  hitAt: number;
}

/**
 * Recovery UI for users whose Firebase Auth account exists but whose Locus
 * wallet provisioning never completed (typically: signup hit Locus's 5/hr
 * rate limit). Shown by main-shell when `firestoreUser` is missing.
 */
export function WalletSetupCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);

  if (!user) return null;

  const minutesLeft = rateLimit
    ? Math.max(
        1,
        Math.ceil(
          (rateLimit.retryAfterSeconds -
            (Date.now() - rateLimit.hitAt) / 1000) /
            60,
        ),
      )
    : null;

  const create = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: user.displayName || "User",
          email: user.email,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setRateLimit({
          retryAfterSeconds: data.retryAfterSeconds || 3600,
          hitAt: Date.now(),
        });
        toast.error(data.message || "Rate limit hit");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Wallet creation failed");
      }
      toast.success("Wallet created");
      // The Firestore listener will pick up the new doc and unmount this card.
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6">
      <div className="w-full border border-border bg-card p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-secondary">
            <Wallet className="h-5 w-5 text-primary" />
          </span>
          <div className="space-y-2">
            <h2 className="type-display-lg text-foreground">
              <span className="font-editorial">Finish</span> setting up your wallet
            </h2>
            <p className="type-body text-muted-foreground">
              Your account is created, but Locus wallet provisioning didn&apos;t
              complete. Click below to finish — your Firebase login + email
              verification stay intact.
            </p>
          </div>
        </div>

        {rateLimit ? (
          <div className="mt-6 flex items-start gap-3 border border-border bg-secondary p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="type-body-sm text-foreground">
                Locus rate limit hit
              </p>
              <p className="type-body-sm text-muted-foreground">
                The Locus beta caps wallet creation at 5 per hour per IP. Try
                again in <span className="text-foreground">~{minutesLeft} min</span>.
                Refreshing this page after that will re-enable the button.
              </p>
            </div>
          </div>
        ) : null}

        <Button
          onClick={create}
          disabled={loading || !!rateLimit}
          className="mt-6 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating wallet…
            </>
          ) : rateLimit ? (
            `Try again in ~${minutesLeft} min`
          ) : (
            "Create my wallet"
          )}
        </Button>
      </div>
    </div>
  );
}
