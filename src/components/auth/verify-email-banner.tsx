"use client";

import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { Mail, RotateCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  if (!user) return null;
  if (user.emailVerified) return null;
  // Google / OAuth providers verify emails for us — only nag password users.
  const isPasswordUser = user.providerData.some(
    (p) => p.providerId === "password",
  );
  if (!isPasswordUser) return null;

  const resend = async () => {
    setResending(true);
    try {
      await sendEmailVerification(user);
      toast.success(`Verification email re-sent to ${user.email}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to resend";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await user.reload();
      // Force re-render so the banner re-evaluates emailVerified.
      setTick((t) => t + 1);
      if (user.emailVerified) {
        toast.success("Email verified");
      } else {
        toast.message("Still unverified. Check your inbox + spam folder.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="border-b border-border bg-secondary px-6 py-3 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
          <p className="type-body-sm text-foreground">
            Verify your email{" "}
            <span className="text-muted-foreground">
              — we sent a link to {user.email}. Confirming locks your password
              login so a later Google sign-in can&apos;t take over.
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resend}
            disabled={resending}
            className="h-8 type-caption"
          >
            {resending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Resend
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            className="h-8 border-border type-caption"
          >
            {refreshing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            I&apos;ve verified
          </Button>
        </div>
      </div>
    </div>
  );
}
