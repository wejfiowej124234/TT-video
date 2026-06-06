import { useEffect } from "react";
import { trackDidRankEvent } from "@/lib/analytics";
import type { Period } from "@/lib/didRankUtils";

/** 同会话内每个「周期 × 榜单类型」空态曝光只上报一次（dev Strict Mode 复挂载不致重复刷屏） */
const didRankEmptyStateImpressionKeys = new Set<string>();

export function useDidRankEmptyStateImpression(
  isLoading: boolean,
  isRefreshing: boolean,
  timeRange: Period,
  travelerCount: number,
  guideCount: number,
) {
  useEffect(() => {
    if (isLoading || isRefreshing) return;
    const fire = (list: "traveler" | "guide", isEmpty: boolean) => {
      if (!isEmpty) return;
      const key = `${timeRange}:${list}`;
      if (didRankEmptyStateImpressionKeys.has(key)) return;
      didRankEmptyStateImpressionKeys.add(key);
      trackDidRankEvent("did_rank_empty_state", { list, period: timeRange });
    };
    fire("traveler", travelerCount === 0);
    fire("guide", guideCount === 0);
  }, [isLoading, isRefreshing, timeRange, travelerCount, guideCount]);
}
