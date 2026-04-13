import type { Metadata } from "next";
import { CharityGrid } from "@/components/charity/charity-grid";

export const metadata: Metadata = {
  title: "Charities",
};

export default function CharitiesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="space-y-3">
        <h1 className="type-display-xl text-foreground">
          <span className="font-editorial">Browse</span> charities
        </h1>
        <p className="type-body-lg max-w-2xl text-muted-foreground">
          Verified organizations doing high-impact work. Every donation is USDC
          on Base — fully on-chain, fully transparent.
        </p>
      </header>
      <CharityGrid />
    </div>
  );
}
