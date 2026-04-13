import { cn } from "@/lib/utils";

interface PlaceholderImageProps {
  aspect?: "3/2" | "4/3" | "16/9" | "1/1";
  label?: string;
  className?: string;
}

export function PlaceholderImage({
  aspect = "3/2",
  label,
  className,
}: PlaceholderImageProps) {
  const aspectClass =
    aspect === "3/2"
      ? "aspect-[3/2]"
      : aspect === "4/3"
        ? "aspect-[4/3]"
        : aspect === "16/9"
          ? "aspect-[16/9]"
          : "aspect-square";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-secondary",
        aspectClass,
        className,
      )}
    >
      {/* Subtle diagonal cross-hatch texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent 0, transparent 11px, rgba(232,223,196,0.05) 11px, rgba(232,223,196,0.05) 12px)",
        }}
      />
      {/* Centered cream four-point-star glyph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-10 w-10"
          fill="none"
        >
          <path
            d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z"
            fill="var(--color-cream)"
            fillOpacity="0.5"
          />
        </svg>
      </div>
      {label ? (
        <span className="absolute bottom-3 left-3 type-caption text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}
