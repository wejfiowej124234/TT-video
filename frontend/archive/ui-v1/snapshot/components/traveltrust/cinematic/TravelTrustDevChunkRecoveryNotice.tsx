"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";

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
    <div
      role="alert"
      className="relative z-[30] mx-auto mb-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/35 bg-amber-950/90 px-3 py-2 text-meta text-amber-100 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
      data-tt-traveltrust-dev-chunk-notice="1"
    >
      <p className="min-w-0 flex-1 leading-relaxed">{t("traveltrust_dev_chunk_notice")}</p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-white/20 px-2.5 py-1 font-medium text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          onClick={() => window.location.reload()}
        >
          {t("traveltrust_webgl_fallback_refresh")}
        </button>
        <button
          type="button"
          className="rounded-md border border-white/14 px-2.5 py-1 text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
          onClick={dismiss}
        >
          {t("traveltrust_page_brief_dismiss")}
        </button>
      </div>
    </div>
  );
}
