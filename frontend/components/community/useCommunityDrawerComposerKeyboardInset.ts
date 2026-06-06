"use client";

import { useEffect, type RefObject } from "react";

/** 移动端评论 composer · visualViewport 键盘顶起（P2-04） */
export function useCommunityDrawerComposerKeyboardInset(
  composerBarRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const el = composerBarRef.current;
      if (!el) return;
      const inset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop ?? 0));
      el.style.paddingBottom = inset > 12 ? `${inset}px` : "";
    };

    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    sync();

    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      const el = composerBarRef.current;
      if (el) el.style.paddingBottom = "";
    };
  }, [composerBarRef]);
}
