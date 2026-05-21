"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TT_DEV_CHUNK_NOTICE_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

const DISMISS_KEY = "tt-traveltrust-dev-chunk-notice-dismiss";

function isChunkLoadMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    (m.includes("_next/static") && m.includes("404"))
  );
}

/** 开发期 stale `.next` chunk 提示（TT-PH1-176 partial · ①） */
export function TravelTrustDevChunkRecoveryNotice() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadMessage(String(event.message ?? ""))) setVisible(true);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
      if (isChunkLoadMessage(msg)) setVisible(true);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (process.env.NODE_ENV !== "development" || !visible) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <motion.div
      role="alert"
      className={TT_DEV_CHUNK_NOTICE_L5.panelClass}
      data-tt-traveltrust-dev-chunk-notice="1"
      data-tt-traveltrust-dev-chunk-notice-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={TT_DEV_CHUNK_NOTICE_L5.entrance}
    >
      <p className="min-w-0 flex-1 leading-relaxed">{t("traveltrust_dev_chunk_notice")}</p>
      <motion.div className="flex shrink-0 flex-wrap items-center gap-2">
        <motion.button
          type="button"
          className={TT_DEV_CHUNK_NOTICE_L5.primaryButtonClass}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          onClick={() => window.location.reload()}
        >
          {t("traveltrust_webgl_fallback_refresh")}
        </motion.button>
        <motion.button
          type="button"
          className={TT_DEV_CHUNK_NOTICE_L5.dismissButtonClass}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          whileTap={reduceMotion ? undefined : TT_DEV_CHUNK_NOTICE_L5.dismissTap}
          onClick={dismiss}
        >
          {t("traveltrust_page_brief_dismiss")}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
