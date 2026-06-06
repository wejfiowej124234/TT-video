"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";

const DISMISS_KEY = "tt-traveltrust-reduced-motion-notice-dismiss";

/** 减动效时说明三维层已关闭（TT-PH1-161 · ①） */
export function TravelTrustReducedMotionNotice() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!UNIFIED_PAGE_3D || !reduceMotion) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) {
    return (
      <p className="sr-only" data-tt-traveltrust-reduced-motion-notice="1" data-tt-traveltrust-reduced-motion-notice-visible="0">
        {t("traveltrust_reduced_motion_3d_off")}
      </p>
    );
  }

  return (
    <div
      role="status"
      className="relative z-[25] mx-auto mb-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-lg border border-ref-teal/25 bg-ink-900/95 px-3 py-2 text-meta text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
      data-tt-traveltrust-reduced-motion-notice="1"
      data-tt-traveltrust-reduced-motion-notice-visible="1"
    >
      <p className="min-w-0 flex-1 leading-relaxed">{t("traveltrust_reduced_motion_3d_off")}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md border border-white/14 px-2.5 py-1 text-meta font-medium text-slate-300 hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
      >
        {t("traveltrust_page_brief_dismiss")}
      </button>
    </div>
  );
}
