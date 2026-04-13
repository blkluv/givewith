"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";

/**
 * Mobile-only entry point. On lg+ the sidebar owns all chrome (brand + nav +
 * user menu + wallet) — desktop shows no topbar at all, giving the content
 * area full viewport height.
 */
export function MobileNavTrigger() {
  return (
    <div className="fixed left-3 top-3 z-30 lg:hidden">
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-card"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent
          side="left"
          className="w-64 border-r border-border bg-sidebar p-0"
        >
          <MobileSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
