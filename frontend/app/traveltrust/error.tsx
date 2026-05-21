"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT } from "@/lib/marketingUi";

/** /traveltrust 品牌入口 · 页面级错误边界；与 85 规格、顶栏深色「TravelTrust」字标一致 */
export default function TraveltrustError({
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
      console.error("TravelTrust page error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className="relative z-10 mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12"
      role="alert"
      data-tt-error-boundary-root="traveltrust"
      data-tt-ui-generation="v2"
    >
      <div className="rounded-[var(--radius-lg)] border border-white/12 bg-ink-800/70 p-6 shadow-scifi-panel backdrop-blur-md ring-1 ring-ref-cyan/15">
        <p className="text-meta font-medium text-slate-400 mb-1">{t("traveltrust_title")}</p>
        <h1 className="text-h4 font-semibold text-white">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-body text-slate-300">
          {t("common_errorMessage")}
        </p>
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
              aria-label={t("common_retry")}
              className={`${TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT} outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-white/20 px-4 py-2 text-small font-medium text-slate-200 hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-slate-300 text-center flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link
            href="/traveltrust"
            className={`${touchTargetLink44Classes} text-ref-cyan hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${communityCardLinkFocus}`}
          >
            {t("traveltrust_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/market" className={`${touchTargetLink44Classes} text-ref-cyan hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${communityCardLinkFocus}`}>
            {t("header_market")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/pay" className={`${touchTargetLink44Classes} text-ref-cyan hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${communityCardLinkFocus}`}>
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-white/10 pt-5 text-meta text-slate-300"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-ref-cyan/90 hover:text-ref-cyan underline ${communityCardLinkFocus}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}
