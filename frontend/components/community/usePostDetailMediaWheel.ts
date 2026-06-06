"use client";

import { useEffect, useRef, type RefObject } from "react";

const WHEEL_DELTA_THRESHOLD = 24;

type Mode = "images" | "videoFeed";

/** 媒体区滚轮：多图/视频连播切条（与 VideoOverlay 同源阈值） */
export function usePostDetailMediaWheel({
  enabled,
  mode,
  onNext,
  onPrev,
}: {
  enabled: boolean;
  mode: Mode | null;
  onNext: () => void;
  onPrev: () => void;
}): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  onNextRef.current = onNext;
  onPrevRef.current = onPrev;

  useEffect(() => {
    if (!enabled || !mode) return;
    const el = ref.current;
    if (!el) return;
    const w = (e: WheelEvent) => {
      let delta = e.deltaY;
      if (mode === "images" && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX;
      }
      if (Math.abs(delta) < WHEEL_DELTA_THRESHOLD) return;
      e.preventDefault();
      if (delta > 0) onNextRef.current();
      else onPrevRef.current();
    };
    el.addEventListener("wheel", w, { passive: false });
    return () => el.removeEventListener("wheel", w);
  }, [enabled, mode]);

  return ref;
}
