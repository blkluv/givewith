"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DonateCancelPage() {
  const searchParams = useSearchParams();
  const charityId = searchParams.get("charityId");

  return (
    <div className="mx-auto flex max-w-lg flex-col py-16 text-center">
      <div className="space-y-3">
        <div className="type-caption text-muted-foreground">Cancelled</div>
        <h1 className="type-display-xl text-foreground">
          No funds were sent.
        </h1>
        <p className="type-body-lg text-muted-foreground">
          You can try again anytime. Your wallet balance is unchanged.
        </p>
      </div>

      <div className="mt-8 border border-border bg-card p-6 type-body-sm text-muted-foreground">
        If you hit an issue, try a different amount or check your wallet
        balance.
      </div>

      <div className="mt-6 flex justify-center">
        {charityId ? (
          <Link href={`/charities/${charityId}`}>
            <Button variant="outline" className="gap-2 border-border">
              <ArrowLeft className="h-4 w-4" />
              Back to charity
            </Button>
          </Link>
        ) : (
          <Link href="/charities">
            <Button variant="outline" className="gap-2 border-border">
              <ArrowLeft className="h-4 w-4" />
              Browse charities
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
