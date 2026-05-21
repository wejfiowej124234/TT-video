"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

const DISMISS_KEY = "tt-traveltrust-page-brief-banner-dismiss";

/** API page-brief 降级时顶栏下提示（可关闭，不挡页面） */
export function TravelTrustPageBriefStatus() {
  const { t } = useTranslation();
  const { brief, degraded, error, source } = useTravelTrustPageBriefContext();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (source === "api") sessionStorage.removeItem(DISMISS_KEY);
  }, [source]);

  if (dismissed === null || dismissed || (!degraded && !error)) return null;

  const text =
    error === "page-brief ia_version mismatch"
      ? t("traveltrust_page_brief_mismatch")
      : t("traveltrust_page_brief_degraded");

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className={`relative ${ttZClass(TT_Z.NAV)} flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-400/25 bg-amber-950/45 px-4 py-2 text-center text-meta text-amber-100/95`}
      role="status"
      data-tt-traveltrust-page-brief-banner-l5="1"
      data-tt-traveltrust-page-brief-degraded={degraded ? "1" : "0"}
      data-tt-traveltrust-page-brief-source={source ?? "unknown"}
      data-tt-traveltrust-page-brief-mode="demo"
      data-tt-traveltrust-page-brief-protocol-version={
        brief?.allocation_ssot?.protocol_reference_doc_version ?? ""
      }
    >
      <span className="shrink-0 rounded-full border border-amber-400/45 bg-amber-400/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
        {t("traveltrust_page_brief_mode_demo")}
      </span>
      <span className="flex-1">{text}</span>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded px-2 py-0.5 text-meta text-slate-300 underline-offset-2 transition hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45"
      >
        {t("traveltrust_page_brief_dismiss")}
      </button>
    </div>
  );
}

