"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** Escrow 评分子段 · 错误边界；与 `escrow/error` 同形 */
export default function EscrowRateSegmentError({
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
      console.error("Escrow rate segment error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main"
      role="alert"
      data-tt-error-boundary-root="escrow-rate"
    >
      <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft">
        <h1 className="text-h4 font-semibold text-ink-900">{t("escrow_errorTitle")}</h1>
        <p className="mt-2 text-body text-ink-600">{t("escrow_errorMessage")}</p>
        <p id={appErrorRetryHintId} className="mt-3 text-meta text-ink-600 leading-relaxed text-center">
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
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/orders"
            className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("nav_orders")}
          </Link>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
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
      </div>
    </main>
  );
}
