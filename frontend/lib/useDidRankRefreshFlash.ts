"use client";

import { useEffect, useRef, useState } from "react";

/** 刷新结束瞬间递增，供 Top10 一次闪动 / 重播 stagger（不作用于文字 transform） */
export function useDidRankRefreshFlash(isRefreshing: boolean): number {
  const [pulse, setPulse] = useState(0);
  const wasRefreshing = useRef(false);

  useEffect(() => {
    if (wasRefreshing.current && !isRefreshing) {
      setPulse((p) => p + 1);
    }
    wasRefreshing.current = isRefreshing;
  }, [isRefreshing]);

  return pulse;
}
