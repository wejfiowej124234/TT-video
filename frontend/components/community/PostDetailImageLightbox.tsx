"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { communityMediaAbsoluteUrlForRender, communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { usePostDetailMediaWheel } from "@/components/community/usePostDetailMediaWheel";

/** 图文详情 · 全屏 Lightbox（多图 ←/→ · 滚轮 · 竖滑 · Esc 关闭） */
export function PostDetailImageLightbox({
  sources,
  initialIndex,
  alt,
  onClose,
  onIndexChange,
  t,
}: {
  sources: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  t: (key: string) => string;
}) {
  const n = sources.length;
  const [index, setIndex] = useState(initialIndex % Math.max(n, 1));
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(initialIndex % Math.max(n, 1));
  }, [initialIndex, n]);

  const go = useCallback(
    (next: number) => {
      const wrapped = ((next % n) + n) % n;
      setIndex(wrapped);
      onIndexChange?.(wrapped);
    },
    [n, onIndexChange],
  );

  const goNext = useCallback(() => go(index + 1), [go, index]);
  const goPrev = useCallback(() => go(index - 1), [go, index]);

  const stageRef = usePostDetailMediaWheel({
    enabled: n > 1,
    mode: n > 1 ? "images" : null,
    onNext: goNext,
    onPrev: goPrev,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && n > 1) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight" && n > 1) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, n, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const src = communityMediaAbsoluteUrlForRender(sources[index] ?? sources[0] ?? "");

  return (
    <div
      className={TT_COMMUNITY_DRAWER_L5.postDetailLightboxOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className={`${TT_COMMUNITY_DRAWER_L5.postDetailLightboxCloseFab} ${communitySlatePillFocus}`}
        onClick={onClose}
        aria-label={t("community_back_drawer")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {n > 1 ? (
        <>
          <button
            type="button"
            className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 ${TT_COMMUNITY_DRAWER_L5.postDetailCarouselNav}`}
            aria-label={t("community_prev_image")}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <button
            type="button"
            className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 ${TT_COMMUNITY_DRAWER_L5.postDetailCarouselNav}`}
            aria-label={t("community_next_image")}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
          <span className={`${TT_COMMUNITY_DRAWER_L5.postDetailImageCounter} top-4 left-4`} aria-live="polite">
            {index + 1} / {n}
          </span>
        </>
      ) : null}

      <div
        ref={stageRef}
        className="relative h-full w-full max-h-[92dvh] max-w-5xl touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          if (n <= 1) return;
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (n <= 1) return;
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const endX = e.changedTouches[0]?.clientX;
          if (endX == null) return;
          const dx = endX - start;
          if (Math.abs(dx) < 48) return;
          if (dx > 0) goPrev();
          else goNext();
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
          unoptimized={communityMediaNextImageUnoptimized(src)}
        />
      </div>
    </div>
  );
}
