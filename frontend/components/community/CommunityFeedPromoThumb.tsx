"use client";



import {

  l5CardMediaGradientShellClass,

  l5CardMediaResolvedAcceptable,

} from "@/lib/l5CardMediaPlaceholder";

import { TT_COMMUNITY_FEED_L5 } from "@/lib/marketingUi";

import { useL5CardMediaReveal } from "@/lib/useL5CardMediaReveal";



export interface CommunityFeedPromoThumbProps {

  src?: string;

  sizes: string;

  fallback?: React.ReactNode;

  className?: string;

  /** Guides parity · stable gradient when fail/tiny/invalid */

  fallbackSeed?: string;

}



/** Promo / 热榜 / 移动条共用 · fail/tiny → Guides 渐变（禁止 1×1 白板） */

export function CommunityFeedPromoThumb({

  src,

  sizes,

  fallback,

  className,

  fallbackSeed,

}: CommunityFeedPromoThumbProps) {

  const resolved = (src ?? "").trim();

  const seed = fallbackSeed?.trim() || resolved || "promo";

  const { degraded, revealed, displaySrc, onLoad, onError, imgRef } = useL5CardMediaReveal(resolved);



  if (!l5CardMediaResolvedAcceptable(resolved) || degraded) {

    if (fallback) return <>{fallback}</>;

    return (

      <div

        aria-hidden

        className={l5CardMediaGradientShellClass(seed, "absolute inset-0 rounded-[inherit]")}

      />

    );

  }



  return (

    <>

      <div

        aria-hidden

        className={l5CardMediaGradientShellClass(seed, "absolute inset-0 rounded-[inherit]")}

      />

      {!revealed ? <div className={TT_COMMUNITY_FEED_L5.promoThumbShimmer} aria-hidden /> : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}

      <img

        ref={imgRef}

        src={displaySrc}

        alt=""

        className={`absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-300 ${

          revealed ? "opacity-100" : "opacity-0"

        } ${className ?? ""}`}

        sizes={sizes}

        loading="lazy"

        decoding="async"

        onLoad={onLoad}

        onError={onError}

      />

    </>

  );

}

