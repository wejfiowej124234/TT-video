"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 首屏稳定后在浏览器空闲时段 `router.prefetch` 常用路径，让顶栏切换时 RSC/JS chunk 已就绪。
 * 与 Header `Link prefetch` 互补（Link 视口内才预取；本组件覆盖「尚未滚到链上」的主路由）。
 * 关闭：`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH=1`
 */
const PRIMARY = [
  "/",
  "/traveltrust",
  "/market",
  "/did-rank",
  "/community",
  "/community/me",
  "/auth/login",
  "/auth/register",
] as const;

const SECONDARY = [
  "/community/explore",
  "/community/messages",
  "/community/activity",
  "/community/friends",
  "/guides",
  "/orders",
  "/staking",
  "/pay",
  "/help",
  "/discover",
  "/guide",
  "/guide/register",
] as const;

function prefetchAll(router: ReturnType<typeof useRouter>, hrefs: readonly string[]) {
  for (const href of hrefs) {
    try {
      router.prefetch(href);
    } catch {
      /* noop */
    }
  }
}

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_DISABLE_IDLE_PREFETCH === "1") return;

    let cancelled = false;
    /** 浏览器 `setTimeout` 句柄为 number；与 Node 的 Timeout 类型分离 */
    let secondaryTimer: number | undefined;

    const runPrimary = () => {
      if (cancelled) return;
      prefetchAll(router, PRIMARY);
      secondaryTimer = window.setTimeout(() => {
        if (cancelled) return;
        prefetchAll(router, SECONDARY);
      }, 1200);
    };

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(() => runPrimary(), { timeout: 4500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
        if (secondaryTimer) clearTimeout(secondaryTimer);
      };
    }

    const t = window.setTimeout(runPrimary, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (secondaryTimer) clearTimeout(secondaryTimer);
    };
  }, [router]);

  return null;
}
