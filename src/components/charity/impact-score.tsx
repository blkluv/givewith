import { cn } from "@/lib/utils";

interface ImpactScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ImpactScore({ score, size = "sm" }: ImpactScoreProps) {
  const color = score >= 90
    ? "text-primary"
    : score >= 80
      ? "text-foreground"
      : "text-muted-foreground";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("type-mono font-medium", sizeClasses[size], color)}>
        {score}
      </span>
      <span className="type-caption text-muted-foreground">impact</span>
    </div>
  );
}
