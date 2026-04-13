interface FundingProgressProps {
  raised: number;
  goal: number;
  showLabel?: boolean;
}

export function FundingProgress({
  raised,
  goal,
  showLabel = true,
}: FundingProgressProps) {
  const percentage = Math.min((raised / goal) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="relative h-[3px] w-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel ? (
        <div className="flex items-baseline justify-between">
          <span className="type-body-sm font-medium text-foreground">
            ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
            <span className="type-caption text-muted-foreground">raised</span>
          </span>
          <span className="type-caption text-muted-foreground">
            of ${goal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      ) : null}
    </div>
  );
}
