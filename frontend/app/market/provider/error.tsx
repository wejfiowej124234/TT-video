"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  errorBoundaryMotionSafeClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
} from "@/lib/travelLinkFocus";

/** `/market/provider` 页面级错误边界；与 `/market` error 同形，便于子站生产观测。 */
export default function MarketProviderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const appErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Market provider page error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className={`mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 ${errorBoundaryMotionSafeClasses}`}
      role="alert"
      data-tt-error-boundary-root="market-provider"
    >
      <h1 className="text-h4 font-semibold text-ink-900">{t("market_errorTitle")}</h1>
      <p className="mt-2 text-body text-ink-600 text-center">{t("common_errorMessage")}</p>
      <p
        id={appErrorRetryHintId}
        className="mt-3 text-meta text-ink-600 leading-relaxed text-center max-w-lg px-2"
      >
        {t("app_error_boundary_retry_hint")}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <form
          className="inline"
          aria-describedby={appErrorRetryHintId}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            reset();
          }}
        >
          <button
            type="submit"
            aria-label={t("common_retry")}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("common_retry")}
          </button>
        </form>
        <Link
          href="/market/provider"
          className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
        >
          {t("market_segment_provider_title")}
        </Link>
        <Link
          href="/"
          aria-label={t("common_backToHome")}
          className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
        >
          {t("common_backToHome")}
        </Link>
      </div>
      <ProductCrossNav
        ariaLabelKey="app_error_relatedNav_aria"
        showGuides
        errorBoundaryCrossNavMarker
        className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
      />
    </main>
  );
}
