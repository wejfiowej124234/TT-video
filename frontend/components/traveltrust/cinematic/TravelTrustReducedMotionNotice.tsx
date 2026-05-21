"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import {
  TT_REDUCED_MOTION_NOTICE_L5,
  TT_REDUCED_MOTION_NOTICE_L5_CLASS,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

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
    <motion.div
      role="status"
      className={TT_REDUCED_MOTION_NOTICE_L5_CLASS}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TT_REDUCED_MOTION_NOTICE_L5.entrance}
      data-tt-traveltrust-reduced-motion-notice="1"
      data-tt-traveltrust-reduced-motion-notice-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-reduced-motion-notice-visible="1"
    >
      <p className="min-w-0 flex-1 leading-relaxed">{t("traveltrust_reduced_motion_3d_off")}</p>
      <button
        type="button"
        onClick={dismiss}
        className={TT_REDUCED_MOTION_NOTICE_L5.dismissButtonClass}
        data-tt-traveltrust-reduced-motion-dismiss-l5="1"
      >
        {t("traveltrust_page_brief_dismiss")}
      </button>
    </motion.div>
  );
}
