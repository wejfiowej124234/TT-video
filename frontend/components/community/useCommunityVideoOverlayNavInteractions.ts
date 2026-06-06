"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { TouchEvent } from "react";
import { COMMUNITY_VIDEO_OVERLAY_SWIPE_PX } from "./communityVideoOverlayUtils";

type Args = {
  open: boolean;
  itemsLength: number;
  atFirst: boolean;
  onClose: () => void;
  setIndex: Dispatch<SetStateAction<number>>;
  setPaused: Dispatch<SetStateAction<boolean>>;
  setVideoError: Dispatch<SetStateAction<boolean>>;
  setProgress: Dispatch<SetStateAction<number>>;
  setSlideDir: Dispatch<SetStateAction<1 | -1 | 0>>;
  onTap?: (clientX: number, clientY: number) => void;
  /** 已在末条仍尝试下一条时（可触发 Feed load-more） */
  onAtLastAdvance?: () => void;
};

export function useCommunityVideoOverlayNavInteractions({
  open,
  itemsLength,
  atFirst,
  onClose,
  setIndex,
  setPaused,
  setVideoError,
  setProgress,
  setSlideDir,
  onTap,
  onAtLastAdvance,
}: Args) {
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const wheelAreaRef = useRef<HTMLDivElement | null>(null);

  const goNext = useCallback(() => {
    if (itemsLength === 0) return;
    setSlideDir(1);
    setIndex((i) => {
      if (i >= itemsLength - 1) {
        onAtLastAdvance?.();
        return i;
      }
      return i + 1;
    });
    setPaused(false);
    setVideoError(false);
    setProgress(0);
  }, [itemsLength, setIndex, setPaused, setVideoError, setProgress, setSlideDir, onAtLastAdvance]);

  const goPrev = useCallback(() => {
    if (itemsLength === 0) return;
    setSlideDir(-1);
    setIndex((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
    setPaused(false);
    setVideoError(false);
    setProgress(0);
  }, [itemsLength, setIndex, setPaused, setVideoError, setProgress, setSlideDir]);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const p = e.touches[0];
    if (!p) return;
    touchRef.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;
      const p = e.changedTouches[0];
      if (!p) return;
      const dx = p.clientX - start.x;
      const dy = p.clientY - start.y;
      if (Math.abs(dy) >= COMMUNITY_VIDEO_OVERLAY_SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) goNext();
        else if (atFirst) onClose();
        else goPrev();
      } else if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
        onTap?.(p.clientX, p.clientY);
      }
    },
    [goNext, goPrev, atFirst, onClose, onTap],
  );

  useEffect(() => {
    if (!open) return;
    const el = wheelAreaRef.current;
    if (!el) return;
    const w = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 24) return;
      e.preventDefault();
      if (e.deltaY > 0) goNext();
      else goPrev();
    };
    el.addEventListener("wheel", w, { passive: false });
    return () => el.removeEventListener("wheel", w);
  }, [open, goNext, goPrev]);

  return {
    wheelAreaRef,
    goNext,
    goPrev,
    onTouchStart,
    onTouchEnd,
  };
}
