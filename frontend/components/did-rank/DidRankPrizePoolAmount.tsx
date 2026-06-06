"use client";

import type { Period } from "@/lib/didRankUtils";
import { useDidRankCountUp } from "@/lib/useDidRankCountUp";

/** 奖金池月度数量 · 进入视口 count-up + 落定 shimmer（尊重 prefers-reduced-motion） */
export function DidRankPrizePoolAmount({
  amount,
  replayKey = "default",
}: {
  amount: number;
  replayKey?: Period | string;
}) {
  const { ref, display, animates, settled } = useDidRankCountUp(amount, {
    replayKey,
  });
  return (
    <span
      ref={ref}
      className="relative inline-block tabular-nums"
      data-tt-did-rank-prize-count-up={animates ? "1" : "0"}
      data-tt-did-rank-prize-settled={settled ? "1" : "0"}
    >
      {display}
    </span>
  );
}
