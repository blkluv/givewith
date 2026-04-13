"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, ExternalLink, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export function UserMenu() {
  const router = useRouter();
  const { user, firestoreUser, signOut } = useAuth();

  if (!user) return null;

  const initials = (firestoreUser?.displayName || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border border-border bg-card text-foreground transition-colors hover:border-primary"
            aria-label="User menu"
          >
            <span className="type-caption">{initials}</span>
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center border border-border bg-card type-caption text-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate type-body-sm font-medium text-foreground">
              {firestoreUser?.displayName || "User"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        {firestoreUser?.locusClaimUrl ? (
          <DropdownMenuItem
            render={
              <a
                href={firestoreUser.locusClaimUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink />
                Fund wallet on Locus
              </a>
            }
          />
        ) : null}
        {firestoreUser?.locusWalletAddress ? (
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(firestoreUser.locusWalletAddress!);
              toast.success("Wallet address copied");
            }}
          >
            <UserIcon />
            Copy wallet address
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
