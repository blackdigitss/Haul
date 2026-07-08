import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";
import { itemThumb } from "@/lib/utils";

/** Item image with shimmer loading + branded gradient placeholder fallback. */
export function ItemImage({
  item,
  className,
  full = false,
  src,
}: {
  item: Pick<Item, "title" | "brand" | "images" | "imageUrls" | "thumbUrls" | "mainImageIndex">;
  className?: string;
  full?: boolean;
  src?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = src ?? itemThumb(item);

  if (!url || failed) {
    const initial = (item.brand || item.title || "?").trim().charAt(0).toUpperCase();
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-secondary to-muted",
          className
        )}
      >
        <span className="font-display text-4xl font-semibold text-muted-foreground/50">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={item.title}
      loading={full ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(!loaded && "img-loading", "object-cover", className)}
    />
  );
}
