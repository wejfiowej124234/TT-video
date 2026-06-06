"use client";

import { useEffect } from "react";

/** 标签页重新可见时刷新数据（从子页返回 Hub 等场景） */
export function usePageVisibleReload(reload: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload, enabled]);
}
