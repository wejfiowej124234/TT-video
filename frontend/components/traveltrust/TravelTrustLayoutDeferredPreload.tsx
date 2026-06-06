"use client";

import { useEffect } from "react";
import {
  isTravelTrustPageBriefV6,
  fetchTravelTrustPageBrief,
} from "@/lib/traveltrustPageBrief";
import {
  resolveAllRoleMediaUrls,
  uniqueRoleVideoPrefetchEntries,
} from "@/lib/traveltrustMediaFromBrief";

/**
 * 角色 MP4 等非首屏关键资源：idle 后再 prefetch，避免 layout 阻塞与带宽争抢。
 */
export function TravelTrustLayoutDeferredPreload() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { brief } = await fetchTravelTrustPageBrief();
        if (cancelled) return;
        const v6 = isTravelTrustPageBriefV6(brief) ? brief : null;
        const roles = resolveAllRoleMediaUrls(v6);
        for (const role of uniqueRoleVideoPrefetchEntries(roles)) {
          if (cancelled) return;
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.as = "video";
          link.href = role.mp4;
          document.head.appendChild(link);
        }
      } catch {
        /* noop */
      }
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => void run(), { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(() => void run(), 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
