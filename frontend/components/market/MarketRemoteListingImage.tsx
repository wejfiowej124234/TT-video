"use client";



import Image from "next/image";

import { useMemo } from "react";

import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

import { l5CardMediaGradientShellClass } from "@/lib/l5CardMediaPlaceholder";

import { useL5CardMediaReveal } from "@/lib/useL5CardMediaReveal";



type Props = {

  src: string;

  alt: string;

  /** 父级需为 `position: relative` 且给出尺寸 */

  fill: true;

  className?: string;

  sizes: string;

  priority?: boolean;

  /** Guides parity · stable gradient when fail/tiny/invalid */

  fallbackSeed?: string;

};



/** Unsplash / OCS API 媒体：直连源 URL，避免 `/_next/image` 域白名单或未配置 loader 失败。 */

function marketListingImageUnoptimized(src: string): boolean {

  const s = src.trim();

  if (s.startsWith("/api/")) return true;

  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;

  try {

    const host = new URL(s).hostname;

    if (host === "images.unsplash.com" || host.endsWith(".unsplash.com")) return true;

    return host.includes("tt-api") || host.endsWith(".fly.dev");

  } catch {

    return false;

  }

}



/** 远程封面图：fail/tiny/invalid → Guides 渐变占位（禁止 1×1 白板铺满）。 */

export default function MarketRemoteListingImage({

  src,

  alt,

  fill,

  className = "",

  sizes,

  priority,

  fallbackSeed,

}: Props) {

  const resolvedSrc = useMemo(() => communityMediaAbsoluteUrlForRender(src), [src]);

  const seed = fallbackSeed?.trim() || src.trim() || alt.trim() || "listing";

  const { degraded, revealed, displaySrc, onLoad, onError, imgRef } = useL5CardMediaReveal(resolvedSrc);



  const gradientUnder = (

    <div aria-hidden className={l5CardMediaGradientShellClass(seed, "absolute inset-0")} />

  );



  if (degraded) {

    return (

      <>

        <span className="sr-only">{alt}</span>

        <div

          aria-hidden

          className={l5CardMediaGradientShellClass(

            seed,

            `absolute inset-0 ring-1 ring-inset ring-ref-sun/14 ${className}`,

          )}

        />

      </>

    );

  }



  const imgSrc = displaySrc || resolvedSrc || src;

  const imgClass = `absolute inset-0 h-full w-full motion-safe:transition-opacity motion-safe:duration-200 ${

    revealed ? "opacity-100" : "opacity-0"

  } ${className}`;



  if (marketListingImageUnoptimized(imgSrc)) {

    return (

      <>

        {gradientUnder}

        {/* eslint-disable-next-line @next/next/no-img-element */}

        <img

          ref={imgRef}

          src={imgSrc}

          alt={alt}

          className={imgClass}

          loading={priority ? "eager" : "lazy"}

          fetchPriority={priority ? "high" : "low"}

          sizes={sizes}

          decoding="async"

          onLoad={onLoad}

          onError={onError}

        />

      </>

    );

  }



  return (

    <>

      {gradientUnder}

      <Image

        src={imgSrc}

        alt={alt}

        fill={fill}

        className={imgClass}

        sizes={sizes}

        priority={Boolean(priority)}

        loading={priority ? undefined : "lazy"}

        fetchPriority={priority ? "high" : "low"}

        unoptimized={false}

        onLoad={onLoad}

        onError={onError}

      />

    </>

  );

}

