"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CommunityMediaHeartBurst = {
  x: number;
  y: number;
  key: number;
};

/** 单击延迟 / 双击点赞 · 与 Feed 卡片、详情抽屉同源 400ms 窗口 */
export function useCommunityMediaTapLike({
  enabled,
  onLike,
  onSingleTap,
  doubleTapMs = 400,
  singleTapDelayMs = 280,
}: {
  enabled: boolean;
  onLike?: () => void;
  onSingleTap?: () => void;
  doubleTapMs?: number;
  singleTapDelayMs?: number;
}) {
  const lastTapRef = useRef(0);
  const singleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heartBurst, setHeartBurst] = useState<CommunityMediaHeartBurst | null>(null);

  const reset = useCallback(() => {
    lastTapRef.current = 0;
    setHeartBurst(null);
    if (singleTimerRef.current) {
      clearTimeout(singleTimerRef.current);
      singleTimerRef.current = null;
    }
  }, []);

  const handleTap = useCallback(
    (clientX: number, clientY: number, container?: HTMLElement | null) => {
      if (!enabled) return;
      let x = clientX;
      let y = clientY;
      if (container) {
        const rect = container.getBoundingClientRect();
        x = clientX - rect.left;
        y = clientY - rect.top;
      }
      const now = Date.now();
      if (now - lastTapRef.current < doubleTapMs) {
        if (singleTimerRef.current) {
          clearTimeout(singleTimerRef.current);
          singleTimerRef.current = null;
        }
        setHeartBurst({ x, y, key: now });
        window.setTimeout(() => setHeartBurst(null), 720);
        onLike?.();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      if (singleTimerRef.current) clearTimeout(singleTimerRef.current);
      singleTimerRef.current = setTimeout(() => {
        singleTimerRef.current = null;
        onSingleTap?.();
      }, singleTapDelayMs);
    },
    [enabled, onLike, onSingleTap, doubleTapMs, singleTapDelayMs],
  );

  useEffect(
    () => () => {
      if (singleTimerRef.current) clearTimeout(singleTimerRef.current);
    },
    [],
  );

  return { handleTap, heartBurst, reset };
}
