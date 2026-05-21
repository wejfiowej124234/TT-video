"use client";

import { useEffect, useState } from "react";
import {
  fetchTravelTrustPageBrief,
  isTravelTrustPageBriefV6,
  type TravelTrustPageBrief,
  type TravelTrustPageBriefSource,
} from "@/lib/traveltrustPageBrief";

/** 挂载时拉取 page-brief，供 CTA 与 04 B-191 机读锚对拍（API 失败用静态 fallback，不挡渲染） */
export function useTravelTrustPageBrief() {
  const [brief, setBrief] = useState<TravelTrustPageBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<TravelTrustPageBriefSource | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchTravelTrustPageBrief()
      .then(({ brief: data, source: src }) => {
        if (cancelled) return;
        if (!isTravelTrustPageBriefV6(data)) {
          setError("page-brief ia_version mismatch");
          setBrief(null);
          setSource(null);
          return;
        }
        setBrief(data);
        setSource(src);
        setError(src === "fallback" ? "page-brief-degraded" : null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    brief,
    error,
    source,
    degraded: source === "fallback",
    ready: brief !== null,
  };
}
