"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { setTraveltrustCinematicQualityPref } from "@/lib/traveltrustCinematicPerf";

type Reason = "lost" | "unsupported" | "loading";

type Props = {
  reason: Reason;
};

/** WebGL 不可用时的可见提示（TT-PH1-175 / 161 · ①） */
export function TravelTrustCinematicFallbackNotice({ reason }: Props) {
  const { t } = useTranslation();
  const key =
    reason === "lost"
      ? "traveltrust_webgl_fallback_lost"
      : reason === "unsupported"
        ? "traveltrust_webgl_fallback_unsupported"
        : "traveltrust_webgl_fallback_loading";

  const showRecovery = reason === "lost";

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[calc(38vh)] z-[3] mx-auto flex max-w-md flex-col items-center gap-2 px-4 text-center"
      data-tt-traveltrust-webgl-fallback-banner="1"
      data-tt-traveltrust-webgl-fallback-reason={reason}
    >
      <p className="text-meta text-slate-400/95">{t(key)}</p>
      {showRecovery ? (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-md border border-white/20 bg-ink-900/80 px-3 py-1.5 text-meta font-medium text-slate-100 transition hover:border-ref-cyan/40 hover:text-ref-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
            data-tt-traveltrust-webgl-fallback-refresh="1"
            onClick={() => window.location.reload()}
          >
            {t("traveltrust_webgl_fallback_refresh")}
          </button>
          <button
            type="button"
            className="rounded-md border border-ref-cyan/35 bg-ref-cyan/10 px-3 py-1.5 text-meta font-medium text-ref-cyan transition hover:bg-ref-cyan/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
            data-tt-traveltrust-webgl-fallback-retry-low="1"
            onClick={() => {
              setTraveltrustCinematicQualityPref("on");
              window.location.reload();
            }}
          >
            {t("traveltrust_webgl_fallback_retry_low")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
