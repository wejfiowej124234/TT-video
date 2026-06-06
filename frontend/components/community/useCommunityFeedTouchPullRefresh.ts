"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

/** 51-31-14：移动端下拉刷新（仅当页面在顶部时生效；从 `useCommunityFeed` 拆出，行为同源）。 */
export function useCommunityFeedTouchPullRefresh(
  pullY: number,
  setPullY: Dispatch<SetStateAction<number>>,
  feedLoading: boolean,
  refreshFeed: () => void,
) {
  const pullYRef = useRef(0);
  pullYRef.current = pullY;
  const feedLoadingRef = useRef(false);
  feedLoadingRef.current = feedLoading;
  const pullStartYRef = useRef<number | null>(null);
  const refreshFeedRef = useRef(refreshFeed);
  refreshFeedRef.current = refreshFeed;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const PULL_THRESHOLD = 50;
    const RESISTANCE = 0.5;
    const handleStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && e.touches[0]) pullStartYRef.current = e.touches[0].clientY;
    };
    const handleMove = (e: TouchEvent) => {
      if (pullStartYRef.current === null || !e.touches[0]) return;
      if (window.scrollY > 0) {
        pullStartYRef.current = null;
        setPullY(0);
        return;
      }
      const dy = (e.touches[0].clientY - pullStartYRef.current) * RESISTANCE;
      if (dy > 0) setPullY(Math.min(dy, 80));
    };
    const handleEnd = () => {
      if (pullYRef.current >= PULL_THRESHOLD && !feedLoadingRef.current) refreshFeedRef.current();
      setPullY(0);
      pullStartYRef.current = null;
    };
    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [setPullY]);
}
