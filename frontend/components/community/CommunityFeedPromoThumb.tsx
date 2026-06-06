"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";

export interface CommunityFeedPromoThumbProps {
  src?: string;
  sizes: string;
  fallback?: React.ReactNode;
  className?: string;
}

/** Promo / 热榜 / 移动条共用 · L5 缩略图 shimmer + 淡入 */
export function CommunityFeedPromoThumb({ src, sizes, fallback, className }: CommunityFeedPromoThumbProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  if (!src) {
    return <>{fallback ?? null}</>;
  }

  return (
    <>
      {!loaded ? <div className={TT_COMMUNITY_FEED_L5.promoThumbShimmer} aria-hidden /> : null}
      <Image
        src={src}
        alt=""
        fill
        className={`object-cover motion-safe:transition-opacity motion-safe:duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
        sizes={sizes}
        unoptimized={communityMediaNextImageUnoptimized(src)}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
