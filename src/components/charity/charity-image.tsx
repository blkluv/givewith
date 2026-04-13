import Image from "next/image";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { getCharityImage } from "@/lib/charity-images";
import { cn } from "@/lib/utils";

type Aspect = "3/2" | "16/9";

interface CharityImageProps {
  name: string;
  aspect?: Aspect;
  priority?: boolean;
  className?: string;
}

/**
 * Renders the charity's hero image from /public/charities, or falls back to
 * the generic PlaceholderImage glyph when no mapping exists.
 */
export function CharityImage({
  name,
  aspect = "3/2",
  priority = false,
  className,
}: CharityImageProps) {
  const src = getCharityImage(name);
  if (!src) return <PlaceholderImage aspect={aspect} className={className} />;

  const aspectClass = aspect === "16/9" ? "aspect-[16/9]" : "aspect-[3/2]";
  // Rough width hint for next/image responsive sizing — charity cards sit in
  // a 1/2/3-col grid on the listing, full-bleed on detail.
  const sizes =
    aspect === "16/9"
      ? "(min-width: 1024px) 66vw, 100vw"
      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-secondary",
        aspectClass,
        className,
      )}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
