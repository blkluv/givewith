import Link from "next/link";
import { LocusWordmark } from "@/components/ui/locus-wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* Brand header */}
      <header className="flex h-16 items-center justify-center border-b border-border px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="BLKLUV.ORG"
        >
          <span className="type-wordmark-lg text-foreground">BLKLUV.ORG</span>
          <LocusWordmark className="text-foreground" height={22} />
        </Link>
      </header>

      {/* Centered panel */}
      <main className="relative flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer strip */}
      <footer className="border-t border-border px-6 py-4 text-center">
        <p className="type-caption text-muted-foreground">
          On-chain giving · Powered by LUV
        </p>
      </footer>
    </div>
  );
}
