import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="border-b border-border px-6 py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="type-brand-hero text-foreground">
          Every dollar tells you exactly where it went.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl type-body-lg text-muted-foreground">
          It takes about a minute to sign up. Your wallet is created
          automatically. You can start with as little as $0.50.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button className="h-12 bg-primary px-8 text-primary-foreground hover:bg-primary/90">
              Start giving
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="h-12 border-border bg-transparent px-8 text-foreground"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
