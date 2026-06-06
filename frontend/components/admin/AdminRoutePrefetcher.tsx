"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { prefetchAdminRoutesBatched } from "@/lib/admin/adminNavPrefetchBatch";
import {
  adminRoutePrefetchSessionActive,
  markAdminRoutePrefetchSessionStarted,
} from "@/lib/admin/adminRoutePrefetchSession";
import {
  ADMIN_ROUTE_PREFETCH_PRIMARY,
  ADMIN_ROUTE_PREFETCH_SECONDARY,
  adminRoutePrefetchTertiaryHrefs,
} from "@/lib/admin/adminRoutePrefetchPaths";

/** Admin 子树 idle 预取：进入 `/admin*` 后分批预热全侧栏路由，减轻 dev 冷编译与切页白屏。 */
export function AdminRoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname.startsWith("/admin")) return;
    if (process.env.NEXT_PUBLIC_DISABLE_IDLE_PREFETCH === "1") return;
    if (adminRoutePrefetchSessionActive()) return;

    markAdminRoutePrefetchSessionStarted();

    let cancelled = false;
    let secondaryTimer: number | undefined;
    let tertiaryTimer: number | undefined;

    const runPrimary = () => {
      if (cancelled) return;
      prefetchAdminRoutesBatched(router, ADMIN_ROUTE_PREFETCH_PRIMARY, { batchSize: 8, gapMs: 32 });
      secondaryTimer = window.setTimeout(() => {
        if (cancelled) return;
        prefetchAdminRoutesBatched(router, ADMIN_ROUTE_PREFETCH_SECONDARY, { batchSize: 6, gapMs: 48 });
        tertiaryTimer = window.setTimeout(() => {
          if (cancelled) return;
          prefetchAdminRoutesBatched(router, adminRoutePrefetchTertiaryHrefs(), {
            batchSize: 5,
            gapMs: 64,
          });
        }, 520);
      }, 280);
    };

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(() => runPrimary(), { timeout: 480 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
        if (secondaryTimer) clearTimeout(secondaryTimer);
        if (tertiaryTimer) clearTimeout(tertiaryTimer);
      };
    }

    const t = window.setTimeout(runPrimary, 16);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (secondaryTimer) clearTimeout(secondaryTimer);
      if (tertiaryTimer) clearTimeout(tertiaryTimer);
    };
  }, [pathname, router]);

  return null;
}
