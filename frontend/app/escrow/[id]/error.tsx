"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_WARM_OUTLINE_COMPACT } from "@/lib/marketingUi";

/** Escrow 订单详情段 · 错误边界；与协议区暗色一致 */
export default function EscrowDetailSegmentError({
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
      console.error("Escrow detail segment error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-[#0a0a0a] text-slate-200"
      role="alert"
      data-tt-error-boundary-root="escrow-detail"
    >
      <div className="order-protocol-zone w-full rounded-[var(--radius-md)] border border-ref-sun/24 bg-slate-950 p-6 shadow-scifi-panel">
        <h1 className="text-h4 font-semibold text-ref-sun/95">{t("escrow_errorTitle")}</h1>
        <p className="mt-2 text-body text-slate-300">{t("escrow_errorMessage")}</p>
        <p id={appErrorRetryHintId} className="mt-3 text-meta text-slate-400 leading-relaxed text-center">
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
              data-tt-escrow-detail-segment-error-retry="1"
              aria-label={t("common_retry")}
              className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} px-4 py-2 text-small focus-visible:ring-offset-ink-900`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} px-4 py-2 focus-visible:ring-offset-ink-900`}
          >
            {t("nav_orders")}
          </Link>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`${touchTargetLink44Classes} ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} px-4 py-2 focus-visible:ring-offset-ink-900`}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
        />
      </div>
    </main>
  );
}
