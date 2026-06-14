"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { CIM_FOCUS } from "./customItineraryModalTheme";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { isExternalItineraryStockImage } from "@/lib/cityDetails/attractionImageOverrides";

export function ItineraryMediaPreviewRow({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">{children}</div>;
}

type ItineraryMediaPreviewCardProps = {
  imageSrc: string;
  title: string;
  description?: string;
  previewAriaLabel: string;
  onPreview: () => void;
  /** data: URL 或 blob 预览时不走 CDN 规范化 */
  rawImageSrc?: boolean;
  onImageError?: () => void;
};

/** 景区/美食/酒店/交通预览卡 — 统一 4:3 · w-36 · 文案区最小高度对齐 */
export function ItineraryMediaPreviewCard({
  imageSrc,
  title,
  description,
  previewAriaLabel,
  onPreview,
  rawImageSrc = false,
  onImageError,
}: ItineraryMediaPreviewCardProps) {
  const src = rawImageSrc ? imageSrc : communityMediaAbsoluteUrlForRender(imageSrc);
  return (
    <form
      className="inline shrink-0 snap-start"
      onSubmit={(e) => {
        e.preventDefault();
        onPreview();
      }}
    >
      <button
        type="submit"
        aria-label={previewAriaLabel}
        className={`shrink-0 w-36 rounded-[var(--radius-sm)] border border-ref-sun/16 bg-ink-950/60 overflow-hidden text-left ${CIM_FOCUS}`}
      >
        <div className="relative aspect-[4/3] w-full bg-ink-800">
          <Image
            src={src}
            alt=""
            aria-hidden
            fill
            className="object-cover object-center"
            sizes="144px"
            unoptimized={rawImageSrc || communityMediaNextImageUnoptimized(src) || isExternalItineraryStockImage(src)}
            onError={onImageError}
          />
        </div>
        <div className="flex min-h-[4.25rem] flex-col justify-start p-3">
          <p className="text-small font-medium text-white line-clamp-1">{title}</p>
          {description ? <p className="mt-1 text-meta text-white/80 line-clamp-2">{description}</p> : null}
        </div>
      </button>
    </form>
  );
}
