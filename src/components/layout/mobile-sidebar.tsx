"use client";

import { SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

export function MobileSidebar() {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <SheetTitle className="sr-only">Navigation</SheetTitle>
      <SidebarContent />
    </div>
  );
}
