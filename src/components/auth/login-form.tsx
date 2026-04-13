"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
// Google sign-in is temporarily disabled — Firebase OAuth consent screen is
// still in "internal" mode (org_internal error for non-workspace emails).
// Re-enable by uncommenting the import + button usage below once the
// consent screen is published External in Google Cloud Console.
// import { GoogleSignInButton } from "./google-sign-in-button";
import { signInAsDemo } from "@/lib/demo-account";
import { Sparkles } from "lucide-react";
import Link from "next/link";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>();

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/dashboard");
    } catch (error: unknown) {
      // If the password sign-in failed, check whether this email exists at
      // all and which providers it uses. Google-only accounts hit this path
      // because Firebase silently replaces an unverified password credential
      // when the same email signs in via Google.
      const code = (error as { code?: string })?.code;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, values.email);
          if (methods.length > 0 && !methods.includes("password")) {
            toast.error(
              "This email is registered with Google. Use ‘Continue with Google’ below.",
            );
            return;
          }
        } catch {
          // fall through to generic error
        }
      }
      const message =
        error instanceof Error ? error.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="type-caption text-muted-foreground"
            >
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="link-lime type-caption"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border-0 surface-cream px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password ? (
            <p className="type-body-sm text-destructive">
              {errors.password.message}
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="relative flex items-center gap-3 type-caption text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* <GoogleSignInButton /> — disabled until OAuth consent screen is published External */}

      <button
        type="button"
        onClick={async () => {
          setDemoLoading(true);
          try {
            await signInAsDemo(auth);
            router.push("/dashboard");
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Demo sign-in failed";
            toast.error(message);
          } finally {
            setDemoLoading(false);
          }
        }}
        disabled={demoLoading}
        className="flex h-11 w-full items-center justify-center gap-2 border border-dashed border-primary/50 bg-transparent type-body-sm text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
      >
        {demoLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Explore with demo account
      </button>

      <p className="text-center type-body-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="link-lime">
          Sign up
        </Link>
      </p>
    </div>
  );
}
