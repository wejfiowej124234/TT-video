"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  ADMIN_HOME_SOFT_REVALIDATE_TTL_MS,
  TT_ADMIN_HOME_SOFT_REVALIDATE_MARK,
  adminHomeSoftRevalidateShouldReload,
} from "@/lib/admin/adminHomeSoftRevalidate";

/**
 * Batch-12 HU-463 · visibility → soft reload when past TTL.
 * Call `markFetched()` after each load attempt (success or fail).
 */
export function useAdminHomeSoftRevalidate(
  reload: () => void,
  enabled = true,
): { markFetched: () => void; mark: string } {
  const lastAtRef = useRef<number | null>(null);

  const markFetched = useCallback(() => {
    lastAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (
        !adminHomeSoftRevalidateShouldReload(
          lastAtRef.current,
          Date.now(),
          ADMIN_HOME_SOFT_REVALIDATE_TTL_MS,
        )
      ) {
        return;
      }
      lastAtRef.current = Date.now();
      reload();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reload, enabled]);

  return { markFetched, mark: TT_ADMIN_HOME_SOFT_REVALIDATE_MARK };
}
