"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNavTrigger } from "./topbar";
import { GutterRules } from "@/components/ui/gutter-rules";
import { DemoModeBanner } from "@/components/auth/demo-mode-banner";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { WalletSetupCard } from "@/components/auth/wallet-setup-card";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const { user, firestoreUser, firestoreUserLoaded } = useAuth();

  const isChat = pathname === "/chat" || pathname?.startsWith("/chat/");
  // Orphaned: signed in to Firebase but no Firestore doc / wallet was ever
  // created (typically Locus 429'd during signup). Replace child routes with
  // the recovery card so dependent components don't crash on a null user doc.
  const orphaned = !!user && firestoreUserLoaded && !firestoreUser;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      {!isChat ? <GutterRules /> : null}
      <Sidebar />
      <MobileNavTrigger />
      <div
        className={cn(
          "relative min-w-0 transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        {isChat ? (
          <main className="relative h-dvh">
            {orphaned ? <WalletSetupCard /> : children}
          </main>
        ) : (
          <>
            <DemoModeBanner />
            <VerifyEmailBanner />
            <main className="relative min-w-0 px-6 py-8 sm:px-8 lg:px-10 lg:pt-10">
              {orphaned ? <WalletSetupCard /> : children}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
