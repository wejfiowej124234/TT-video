"use client";

import { useEffect } from "react";
import { runTraveltrustHomeCriticalPrefetch } from "../core/prefetch";

/** layout 级：路由进入 /traveltrust 即开始预取（不挡渲染） */
export function TravelTrustHomePrefetchBoot() {
  useEffect(() => {
    runTraveltrustHomeCriticalPrefetch();
  }, []);
  return null;
}
