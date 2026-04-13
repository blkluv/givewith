"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { signInAsDemo } from "@/lib/demo-account";
// Google sign-in is temporarily disabled — see note in login-form.tsx.
// import { GoogleSignInButton } from "./google-sign-in-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";

type RegisterValues = {
  displayName: string;
  email: string;
  password: string;
};

interface WalletInfo {
  walletAddress: string;
  claimUrl: string;
  ownerPrivateKey: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>();

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      await updateProfile(cred.user, { displayName: values.displayName });

      // Fire and forget — Firebase's default sender. If a later Google
      // sign-in arrives before the user verifies, Firebase will silently
      // replace the password credential with the Google one. Verification
      // closes that window.
      sendEmailVerification(cred.user).catch(() => {
        /* surfaced via dashboard banner if it failed */
      });

      const token = await cred.user.getIdToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: values.displayName,
          email: values.email,
        }),
      });

      if (res.status === 429) {
        const err = await res.json();
        const minutes = Math.ceil((err.retryAfterSeconds || 3600) / 60);
        toast.error(
          `Locus rate limit hit (5 wallets/hr). Your account is saved — try again in ~${minutes} min and we'll finish setup automatically.`,
        );
        // Land on dashboard so WalletSetupCard takes over the recovery flow.
        router.push("/dashboard");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Wallet registration failed");
      }

      const data = await res.json();

      setWalletInfo({
        walletAddress: data.walletAddress,
        claimUrl: data.claimUrl,
        ownerPrivateKey: data.ownerPrivateKey,
      });
      setShowKeyModal(true);

      toast.success("Account created. Your wallet is being set up.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleCloseKeyModal = () => {
    setShowKeyModal(false);
    setWalletInfo(null);
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="displayName" className="type-caption text-muted-foreground">
            Full name
          </Label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className="w-full border-0 surface-cream px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            {...register("displayName", {
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
          />
          {errors.displayName ? (
            <p className="type-body-sm text-destructive">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>

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
          <Label htmlFor="password" className="type-caption text-muted-foreground">
            Password
          </Label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
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
              Creating wallet…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="relative flex items-center gap-3 type-caption text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Google sign-up disabled until OAuth consent is External */}

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
        Skip signup — explore with demo account
      </button>

      <p className="text-center type-body-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="link-lime">
          Sign in
        </Link>
      </p>

      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="type-heading">
              Save your recovery key
            </DialogTitle>
            <DialogDescription className="type-body-sm text-muted-foreground">
              This key is shown only once. Save it somewhere safe — you&apos;ll
              need it to recover your wallet.
            </DialogDescription>
          </DialogHeader>

          {walletInfo ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="type-caption text-muted-foreground">
                  Wallet address
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 border border-border bg-secondary p-3 font-mono text-xs break-all text-foreground">
                    {walletInfo.walletAddress}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(walletInfo.walletAddress)}
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="type-caption text-destructive">
                  Recovery private key · save this
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs break-all text-foreground">
                    {walletInfo.ownerPrivateKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(walletInfo.ownerPrivateKey)}
                    aria-label="Copy private key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <a
                href={walletInfo.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 type-body-sm link-lime"
              >
                Open Locus Dashboard to fund wallet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Button
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCloseKeyModal}
              >
                I&apos;ve saved my key — continue
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
