"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TT_SPACING_DEBUG_GAP_TARGETS_PX,
  TT_SPACING_DEBUG_SECTION_LABELS,
  buildTravelTrustSpacingDebugUrl,
  isTravelTrustSpacingDebugEnabled,
  setTravelTrustSpacingDebugEnabled,
  shouldMountTravelTrustSpacingDebug,
} from "@/lib/traveltrustSpacingDebug";

type GapRow = {
  key: string;
  label: string;
  px: number;
  target: number;
  ok: boolean;
};

const SECTION_ORDER = ["theater", "liquidity", "trust", "settlement", "faq", "start"] as const;

function measureSectionGaps(): GapRow[] {
  const rows: GapRow[] = [];
  for (let i = 0; i < SECTION_ORDER.length - 1; i += 1) {
    const fromId = SECTION_ORDER[i];
    const toId = SECTION_ORDER[i + 1];
    const fromEl =
      document.querySelector<HTMLElement>(`[data-tt-traveltrust-spacing-section="${fromId}"]`) ??
      document.getElementById(fromId === "theater" ? "roles" : toId);
    const toEl =
      document.querySelector<HTMLElement>(`[data-tt-traveltrust-spacing-section="${toId}"]`) ??
      document.getElementById(toId);
    if (!fromEl || !toEl) continue;
    const gapKey = `${fromId}→${toId}`;
    const px = Math.round(toEl.getBoundingClientRect().top - fromEl.getBoundingClientRect().bottom);
    const target = TT_SPACING_DEBUG_GAP_TARGETS_PX[gapKey] ?? 64;
    rows.push({
      key: gapKey,
      label: `${TT_SPACING_DEBUG_SECTION_LABELS[fromId] ?? fromId} → ${TT_SPACING_DEBUG_SECTION_LABELS[toId] ?? toId}`,
      px,
      target,
      ok: px >= target - 8,
    });
  }
  return rows;
}

/** 一键检视 `/traveltrust` 各节外间距（① dev 或 `?tt_spacing=1`） */
export function TravelTrustSectionSpacingDebug() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [gaps, setGaps] = useState<GapRow[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showChrome = mounted && shouldMountTravelTrustSpacingDebug();

  const refresh = useCallback(() => {
    if (!isTravelTrustSpacingDebugEnabled()) return;
    setGaps(measureSectionGaps());
  }, []);

  useEffect(() => {
    if (!showChrome) return;
    const enabled = isTravelTrustSpacingDebugEnabled();
    setActive(enabled);
    document.body.dataset.ttSpacingDebug = enabled ? "1" : "0";
    if (!enabled) return;
    const run = () => setGaps(measureSectionGaps());
    run();
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, { passive: true });
    const id = window.setInterval(run, 800);
    return () => {
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run);
      window.clearInterval(id);
      delete document.body.dataset.ttSpacingDebug;
    };
  }, [active, showChrome]);

  const toggle = useCallback(() => {
    const next = !active;
    setTravelTrustSpacingDebugEnabled(next);
    window.location.assign(buildTravelTrustSpacingDebugUrl(next));
  }, [active]);

  if (!showChrome) {
    return null;
  }

  return (
    <>
      {active ? (
        <style>{`
          body[data-tt-spacing-debug="1"] [data-tt-traveltrust-spacing-section] {
            outline: 2px dashed rgba(252, 164, 124, 0.55);
            outline-offset: -2px;
          }
          body[data-tt-spacing-debug="1"] [data-tt-traveltrust-spacing-gap] {
            background: rgba(56, 189, 248, 0.12) !important;
            outline: 1px dotted rgba(125, 211, 252, 0.45);
          }
        `}</style>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 right-4 z-[200] rounded-full border border-ref-sun/35 bg-ink-950/92 px-4 py-2.5 text-meta font-semibold text-ref-sun shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-ref-sun/55 hover:bg-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50"
        aria-pressed={active}
        data-tt-traveltrust-spacing-debug-toggle="1"
      >
        {active ? "关闭间距调试" : "间距调试"}
      </button>
      {active ? (
        <div
          className="fixed bottom-16 right-4 z-[200] max-h-[min(70vh,28rem)] w-[min(100vw-2rem,22rem)] overflow-auto rounded-xl border border-ref-sun/22 bg-ink-950/94 p-3 text-meta text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
          role="status"
          data-tt-traveltrust-spacing-debug-panel="1"
        >
          <p className="font-semibold text-ref-sun/95">区块外间距（① 调试）</p>
          <p className="mt-1 text-slate-400">橙框=节边界 · 蓝带=film 缝 · 目标约 64–72px</p>
          <ul className="mt-2 space-y-1.5">
            {gaps.map((row) => (
              <li key={row.key} className={row.ok ? "text-slate-300" : "text-amber-200"}>
                {row.label}: <strong>{row.px}px</strong>
                <span className="text-slate-500"> / 目标 ≥{row.target - 8}px</span>
                {!row.ok ? <span className="ml-1 text-amber-300/90">偏紧</span> : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 text-ref-sun/90 underline underline-offset-2 hover:text-ref-sun"
            onClick={refresh}
          >
            重新测量
          </button>
        </div>
      ) : null}
    </>
  );
}
