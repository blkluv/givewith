"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Heart,
  History,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { LocusLogo } from "@/components/ui/locus-logo";
import { LocusWordmark } from "@/components/ui/locus-wordmark";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/chat", label: "Chat Agent", icon: MessageSquare },
    ],
  },
  {
    title: "Giving",
    items: [
      { href: "/charities", label: "Charities", icon: Heart },
      { href: "/donations", label: "History", icon: History },
    ],
  },
];

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export function SidebarContent() {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className="flex h-full flex-col">
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "flex h-16 items-center px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              aria-label="GiveWithLocus"
            >
              <span className="type-wordmark text-foreground">GiveWith</span>
              <LocusWordmark className="text-foreground" height={18} />
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          collapsed ? "py-2" : "py-4",
        )}
      >
        {navSections.map((section, i) => (
          <SidebarSection
            key={section.title}
            section={section}
            collapsed={collapsed}
            isFirst={i === 0}
          />
        ))}
      </nav>

      {/* Footer — wallet + user menu, zero dividers */}
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

function SidebarSection({
  section,
  collapsed,
  isFirst,
}: {
  section: NavSection;
  collapsed: boolean;
  isFirst: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className={cn(collapsed ? "mb-2" : "mb-5", isFirst && "mt-0")}>
      {!collapsed ? (
        <h3 className="type-caption mb-1.5 px-4 text-muted-foreground">
          {section.title}
        </h3>
      ) : null}
      <ul className={cn(collapsed && "flex flex-col gap-1")}>
        {section.items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <li
              key={item.href}
              className={cn(
                "relative",
                collapsed && "mx-auto h-9 w-9",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 40,
                  }}
                />
              )}
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center text-sm transition-colors",
                  collapsed
                    ? "h-full w-full justify-center"
                    : "gap-3 px-4 py-2.5",
                  isActive
                    ? "font-medium text-primary-foreground"
                    : "text-secondary-foreground hover:text-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {!collapsed ? (
                  <span className="truncate">{item.label}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { firestoreUser, walletBalance, balanceLoading } = useAuth();

  return (
    <div className={cn("space-y-3 py-4", collapsed ? "px-2" : "px-4")}>
      {!collapsed ? (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="type-caption text-muted-foreground">Wallet</div>
            <div className="mt-0.5 type-mono text-sm text-foreground">
              {balanceLoading ? (
                <span className="text-muted-foreground">…</span>
              ) : walletBalance !== null ? (
                <>
                  ${Number(walletBalance).toFixed(2)}{" "}
                  <span className="text-[10px] text-muted-foreground">
                    USDC
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          {firestoreUser?.locusClaimUrl ? (
            <a
              href={firestoreUser.locusClaimUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Fund wallet"
              aria-label="Fund wallet on Locus"
              className="shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : (
        <div className="text-center type-caption text-muted-foreground">
          {balanceLoading
            ? "…"
            : walletBalance !== null
              ? `$${Number(walletBalance).toFixed(0)}`
              : "—"}
        </div>
      )}

      <SidebarUserMenu collapsed={collapsed} />
    </div>
  );
}

function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { user, firestoreUser, signOut } = useAuth();

  if (!user) return null;

  const name = firestoreUser?.displayName || user.email || "User";
  const initials = name
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

  const copyAddress = () => {
    if (firestoreUser?.locusWalletAddress) {
      navigator.clipboard.writeText(firestoreUser.locusWalletAddress);
      toast.success("Wallet address copied");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              "flex w-full items-center gap-2.5 text-left transition-colors",
              collapsed ? "justify-center" : "justify-start",
              "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-card text-xs text-foreground">
              {initials}
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate type-body-sm text-foreground">
                  {firestoreUser?.displayName || "Account"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
            ) : null}
          </button>
        }
      />
      <DropdownMenuContent
        side="top"
        align={collapsed ? "center" : "start"}
        sideOffset={8}
        className="w-60"
      >
        <div className="px-2 py-2">
          <div className="truncate type-body-sm font-medium text-foreground">
            {firestoreUser?.displayName || "Account"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
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
          <DropdownMenuItem onClick={copyAddress}>
            <Copy />
            Copy wallet address
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
