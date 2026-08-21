"use client";

import { useEffect } from "react";
import {
  installTraveltrustDomCompositorAuditApi,
  shouldMountTraveltrustDomCompositorAudit,
} from "@/lib/traveltrustDomCompositorAudit";

/** `?tt_dom_compositor_audit=1` — 蓝块区 elementsFromPoint + fixed/z-index 清单 */
export function TravelTrustDomCompositorAudit() {
  useEffect(() => {
    if (!shouldMountTraveltrustDomCompositorAudit()) return;
    const t = window.setTimeout(() => {
      installTraveltrustDomCompositorAuditApi();
      console.info(
        "[TT dom compositor audit] 已输出。Console: __ttDomCompositorAudit.dump() · __ttDomCompositorAudit.fixedNodes()",
      );
    }, 1600);
    return () => window.clearTimeout(t);
  }, []);

  if (!shouldMountTraveltrustDomCompositorAudit()) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-36 left-4 z-[220] max-w-md rounded-lg border border-violet-400/40 bg-ink-950/92 px-3 py-2 font-mono text-[11px] leading-relaxed text-violet-100/90 shadow-lg"
      role="status"
      data-tt-traveltrust-dom-compositor-audit-hud="1"
    >
      <div className="font-semibold text-violet-300">TT DOM compositor audit</div>
      <div>Console: __ttDomCompositorAudit.dump()</div>
      <div className="text-slate-400">蓝块采样 · fixed z&gt;0 · mix-blend/mask/gradient</div>
    </div>
  );
}
