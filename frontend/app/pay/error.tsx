"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  payHubErrorPanelClass,
  payHubFooterLinkClass,
  payHubMetaClass,
  payHubPrimaryCtaClass,
  payHubSecondaryCtaClass,
  payHubTitleClass,
  TT_PAY_HUB_PAGE_SHELL,
  payHubL5MainDataAttrs,
} from "@/lib/pay/payHubL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** `/pay` 路由段错误边界 · L5 暖色壳（①） */
export default function PayError({
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
      console.error("Pay page error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className={`${TT_PAY_HUB_PAGE_SHELL} flex min-h-[50vh] flex-col items-center justify-center px-6 py-12`}
      role="alert"
      data-tt-error-boundary-root="pay"
      {...payHubL5MainDataAttrs()}
    >
      <div className={payHubErrorPanelClass}>
        <p className={`${payHubMetaClass} mb-1`}>{t("pay_pageTitle")}</p>
        <h1 className={payHubTitleClass}>{t("common_errorTitle")}</h1>
        <p className={`mt-2 ${payHubMetaClass}`}>{t("common_errorMessage")}</p>
        <p id={appErrorRetryHintId} className={`mt-3 ${payHubMetaClass} leading-relaxed text-center`}>
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
            <button type="submit" aria-label={t("common_retry")} className={payHubPrimaryCtaClass}>
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} inline-flex items-center ${payHubSecondaryCtaClass}`}
          >
            {t("nav_orders")}
          </Link>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`${touchTargetLink44Classes} inline-flex items-center ${payHubSecondaryCtaClass}`}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <ProductCrossNav
          ariaLabelKey="pay_relatedNav_aria"
          showGuides
          className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-slate-400"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center ${payHubFooterLinkClass}`}
        />
      </div>
    </main>
  );
}
