import Link from "next/link";
import { LocusWordmark } from "@/components/ui/locus-wordmark";

export function LandingFooter() {
  return (
    <footer className="px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="type-wordmark text-foreground">BLKLUV.ORG</span>
          <LocusWordmark className="text-foreground" height={18} />
        </div>
        <nav className="flex flex-wrap items-center gap-6 type-caption text-muted-foreground">
          <span>© {new Date().getFullYear()} BLKLUV.ORG</span>
          <span>Built with LUV</span>
          <Link href="/charities" className="hover:text-foreground">
            Charities
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
