"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { isDemoEmail } from "@/lib/demo-account";
import { toast } from "sonner";

export function DemoModeBanner() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  if (!user || !isDemoEmail(user.email)) return null;

  const handleLeave = async () => {
    try {
      await signOut();
      toast.success("Signed out of demo");
      router.push("/register");
    } catch {
      toast.error("Sign-out failed");
    }
  };

  return (
    <div className="border-b border-primary/30 bg-primary/10 px-6 py-3 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
          <p className="type-body-sm text-foreground">
            Demo mode{" "}
            <span className="text-muted-foreground">
              — shared public account. Donations are real USDC on Base; please
              use small amounts so other visitors can try too.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLeave}
          className="shrink-0 type-caption text-primary underline-offset-2 hover:underline"
        >
          Sign out & create your own →
        </button>
      </div>
    </div>
  );
}
