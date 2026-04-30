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
          className={`absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-ref-cyan/20 ring-1 ring-inset ring-white/10 ${className}`}
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
      fetchPriority={priority ? "high" : "low"}
      onError={onError}
    />
  );
}
