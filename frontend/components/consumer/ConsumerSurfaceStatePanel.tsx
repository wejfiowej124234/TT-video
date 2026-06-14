"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

export type ConsumerSurfaceState =
  | "loading"
  | "empty"
  | "error"
  | "ready";

export type ConsumerSurfaceStatePanelProps = {
  state: ConsumerSurfaceState;
  surface: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
};

/** Consumer cold-start surfaces · loading / empty / error / ready (UX-P0-01). */
export function ConsumerSurfaceStatePanel(props: ConsumerSurfaceStatePanelProps) {
  const { state, surface, onRetry, children, className = "" } = props;
  const { t } = useTranslation();

  if (state === "ready") {
    return <>{children}</>;
  }

  const wrap = `mx-auto w-full max-w-3xl px-3 sm:px-4 ${className}`.trim();

  if (state === "loading") {
    return (
      <section
        className={wrap}
        data-tt-cold-start-surface={surface}
        data-tt-cold-start-loading="1"
        aria-busy="true"
        aria-label={t("cold_start_surface_loading_aria")}
      >
        <div className="rounded-[var(--radius-md)] border border-white/10 bg-ink-900/40 px-3 py-3 backdrop-blur-sm">
          <div className="h-3 w-1/3 animate-pulse rounded bg-white/20" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/15" />
          <div className="mt-3 flex gap-2">
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
          </div>
          <p className="mt-2 text-meta text-white/60">{t("cold_start_surface_loading")}</p>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section
        className={wrap}
        data-tt-cold-start-surface={surface}
        data-tt-cold-start-error="1"
        role="alert"
      >
        <div className="rounded-[var(--radius-md)] border border-red-400/30 bg-ink-900/55 px-3 py-3">
          <p className="text-small text-red-200">{t("cold_start_surface_error")}</p>
          {onRetry ? (
            <button
              type="button"
              className={`mt-2 ${adminPageNavLinkClass()} text-ref-sun`}
              data-tt-cold-start-retry="1"
              onClick={() => void onRetry()}
            >
              {t("cold_start_surface_retry")}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (state === "empty") {
    return null;
  }

  return null;
}
