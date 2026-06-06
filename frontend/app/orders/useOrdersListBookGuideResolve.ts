"use client";

import { useEffect, useState, useRef } from "react";
import { getGuide } from "@/lib/apiClient";
import { isUuidString } from "@/lib/isUuidString";
import { parseGuideDetailForRoute } from "@/lib/guideDetailRoutePayload";
import type { BookGuideResolve } from "./ordersListPageModel";

/** B-036：`book_guide` 须 `getGuide` 命中才展示「预约」正反馈；否则 banner + /guides /market */
export function useOrdersListBookGuideResolve(bookGuideParam: string): BookGuideResolve {
  const [bookGuideResolve, setBookGuideResolve] = useState<BookGuideResolve>("idle");
  const bookGuideFetchGen = useRef(0);

  useEffect(() => {
    if (!bookGuideParam) {
      setBookGuideResolve("idle");
      return;
    }
    if (!isUuidString(bookGuideParam)) {
      setBookGuideResolve("invalid_book_guide_id");
      return;
    }
    const gen = ++bookGuideFetchGen.current;
    setBookGuideResolve("checking");
    getGuide(bookGuideParam)
      .then((raw) => {
        if (gen !== bookGuideFetchGen.current) return;
        if (!parseGuideDetailForRoute(raw, bookGuideParam)) {
          setBookGuideResolve("invalid_load");
          return;
        }
        setBookGuideResolve("valid");
      })
      .catch((err) => {
        if (gen !== bookGuideFetchGen.current) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg === "guide_not_found" || msg === "not_found") {
          setBookGuideResolve("invalid_not_found");
          return;
        }
        if (typeof window !== "undefined") {
          console.error("OrdersPage book_guide getGuide:", err);
        }
        setBookGuideResolve("invalid_load");
      });
  }, [bookGuideParam]);

  return bookGuideResolve;
}
