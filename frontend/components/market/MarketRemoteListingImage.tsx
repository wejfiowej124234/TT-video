"use client";



import Image from "next/image";

import { useCallback, useState } from "react";



type Props = {

  src: string;

  alt: string;

  /** 父级需为 `position: relative` 且给出尺寸 */

  fill: true;

  className?: string;

  sizes: string;

  priority?: boolean;

};



/** Unsplash 等外链：直连 CDN，避免 dev 下 `/_next/image` 二次拉取失败。 */

function marketListingImageUnoptimized(src: string): boolean {

  const s = src.trim();

  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;

  try {

    const host = new URL(s).hostname;

    return host === "images.unsplash.com" || host.endsWith(".unsplash.com");

  } catch {

    return false;

  }

}



/** 远程封面图：加载失败时降级为渐变占位，避免卡片/详情出现裂图。 */

export default function MarketRemoteListingImage({ src, alt, fill, className = "", sizes, priority }: Props) {

  const [failed, setFailed] = useState(false);

  const onError = useCallback(() => setFailed(true), []);



  if (failed) {

    return (

      <>

        <span className="sr-only">{alt}</span>

        <div

          aria-hidden

          className={`absolute inset-0 bg-gradient-to-br from-ink-800/95 via-ink-900/92 to-[#0c0a09] ring-1 ring-inset ring-ref-sun/14 ${className}`}

        />

      </>

    );

  }



  return (

    <Image

      src={src}

      alt={alt}

      fill={fill}

      className={className}

      sizes={sizes}

      priority={Boolean(priority)}
      loading={priority ? undefined : "lazy"}
      fetchPriority={priority ? "high" : "low"}

      unoptimized={marketListingImageUnoptimized(src)}

      onError={onError}

    />

  );

}

