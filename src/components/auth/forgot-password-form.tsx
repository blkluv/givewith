"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Values = { email: string };
type Result =
  | { kind: "sent"; email: string }
  | { kind: "google-only"; email: string };

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>();

  const onSubmit = async ({ email }: Values) => {
    setLoading(true);
    try {
      // If the email is registered ONLY with Google, a reset email would
      // never arrive — tell the user to use Google instead.
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0 && !methods.includes("password")) {
        setResult({ kind: "google-only", email });
        return;
      }

      // Either the email has a password credential, or doesn't exist at all.
      // We send regardless to avoid leaking which emails are registered.
      await sendPasswordResetEmail(auth, email);
      setResult({ kind: "sent", email });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (result?.kind === "sent") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 border border-border bg-secondary p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="type-body text-foreground">Check your inbox</p>
            <p className="type-body-sm text-muted-foreground">
              If an account exists for{" "}
              <span className="text-foreground">{result.email}</span>, a reset
              link has been sent. It may take a minute to arrive — check spam
              if you don&apos;t see it.
            </p>
          </div>
        </div>
        <Link href="/login" className="link-lime block text-center type-body-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (result?.kind === "google-only") {
    return (
      <div className="space-y-6">
        <div className="border border-border bg-secondary p-4">
          <p className="type-body text-foreground">
            This email is registered with Google
          </p>
          <p className="mt-1 type-body-sm text-muted-foreground">
            <span className="text-foreground">{result.email}</span> was signed
            up using &ldquo;Continue with Google&rdquo;. There&apos;s no
            password to reset — just sign in with Google.
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full bg-primary py-3 text-center type-body text-primary-foreground hover:bg-primary/90"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="type-caption text-muted-foreground">
          Email
        </Label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full border-0 surface-cream px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Please enter a valid email",
            },
          })}
        />
        {errors.email ? (
          <p className="type-body-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-center type-body-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="link-lime">
          Sign in
        </Link>
      </p>
    </form>
  );
}
