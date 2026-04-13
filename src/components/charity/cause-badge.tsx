import { CAUSE_LABELS, CAUSE_COLORS, type CharityCause } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CauseBadgeProps {
  cause: CharityCause;
  className?: string;
}

export function CauseBadge({ cause, className }: CauseBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        CAUSE_COLORS[cause] || "border-border text-muted-foreground",
        className,
      )}
    >
      {CAUSE_LABELS[cause] || cause}
    </span>
  );
}
