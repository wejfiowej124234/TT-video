"use client";

import { useEffect } from "react";

function didRankPollIntervalMs(): number {
  const raw = (process.env.NEXT_PUBLIC_DID_RANK_POLL_MS ?? "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 30_000) return 0;
  return Math.min(n, 300_000);
}

/** ② 可选：周期拉取刷新榜（① 默认关；`NEXT_PUBLIC_DID_RANK_POLL_MS`≥30000 启用） */
export function useDidRankLivePoll(onPoll: () => void, enabled: boolean): boolean {
  const ms = didRankPollIntervalMs();
  const active = enabled && ms > 0;

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(onPoll, ms);
    return () => window.clearInterval(id);
  }, [active, ms, onPoll]);

  return active;
}
