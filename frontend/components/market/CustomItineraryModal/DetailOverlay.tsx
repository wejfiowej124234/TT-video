"use client";

import Image from "next/image";
import { useId } from "react";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";

export interface DetailOverlayProps {
  image: string;
  title: string;
  description: string;
  onClose: () => void;
  /** 关闭按钮读屏名；须走 t(key)，禁止依赖组件内硬编码文案 */
  closeLabel: string;
  overlayRef?: React.RefObject<HTMLDivElement | null>;
}

export default function DetailOverlay({
  image,
  title,
  description,
  onClose,
  closeLabel,
  overlayRef,
}: DetailOverlayProps) {
  const titleId = useId();
  const descId = useId();
  return (
    <div
      ref={overlayRef as React.RefObject<HTMLDivElement> | undefined}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={onClose}
    >
      <div
        className={TT_MARKETING_MARKET_DARK_PATH.customItineraryOverlayPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-slate-800">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
            unoptimized
          />
        </div>
        <div className="p-4">
          <h4 id={titleId} className="text-body font-semibold text-white">
            {title}
          </h4>
          <p id={descId} className="mt-2 text-small text-white/90">
            {description}
          </p>
        </div>
        <form
          className="absolute top-2 right-2 inline"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-ink-950/60 text-slate-100 hover:bg-ref-sun/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55"
            aria-label={closeLabel}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
