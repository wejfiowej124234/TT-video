"use client";

import Image from "next/image";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { TT_MARKETING_MARKET_DARK_PATH } from "@/lib/marketingUi";
import {
  itinNestedImagePreviewPortalRootClass,
  itinNestedImagePreviewScrimClass,
} from "@/components/market/marketStudioModalLayout";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";

export interface DetailOverlayProps {
  image: string;
  title: string;
  description: string;
  onClose: () => void;
  /** 关闭按钮读屏名；须走 t(key)，禁止依赖组件内硬编码文案 */
  closeLabel: string;
  overlayRef?: React.RefObject<HTMLDivElement | null>;
  /** 向导上传的 data URL 预览 */
  rawImageSrc?: boolean;
  escHint?: string;
}

export default function DetailOverlay({
  image,
  title,
  description,
  onClose,
  closeLabel,
  overlayRef,
  rawImageSrc = false,
  escHint,
}: DetailOverlayProps) {
  const titleId = useId();
  const descId = useId();
  const trapRef = useFocusTrap(true, onClose);
  const src = rawImageSrc ? image : communityMediaAbsoluteUrlForRender(image);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const setRef = (el: HTMLDivElement | null) => {
    if (overlayRef) (overlayRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={itinNestedImagePreviewPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={onClose}
    >
      <div className={itinNestedImagePreviewScrimClass} aria-hidden onClick={onClose} />
      <div
        ref={setRef}
        className={TT_MARKETING_MARKET_DARK_PATH.customItineraryOverlayPanel}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="relative aspect-[4/3] w-full bg-ink-800">
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 448px) 100vw, 448px"
            unoptimized={rawImageSrc || communityMediaNextImageUnoptimized(src)}
          />
        </div>
        <div className="p-4">
          <h4 id={titleId} className="text-body font-semibold text-white">
            {title}
          </h4>
          <p id={descId} className="mt-2 text-small text-white/90">
            {description}
          </p>
          {escHint ? <p className="mt-3 text-meta text-white/55">{escHint}</p> : null}
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
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
