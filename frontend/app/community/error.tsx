"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCardLinkFocus, communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { deepShellInlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** 31 TT社区 · 页面级错误边界（与 30 §8.6 / did-rank 一致）；赛博风 + role="alert"；文案 i18n */
export default function CommunityError({
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
      console.error("Community page error:", error?.message);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 safe-area-inset-t safe-area-inset-b" role="alert">
      <div className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-slate-900/70 backdrop-blur-md px-6 py-8 max-w-md text-center">
        <h1 className="text-h4 font-semibold text-ref-sun/90">{t("community_errorTitle")}</h1>
        <p className="mt-2 text-small text-slate-300">
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
              className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
              aria-label={t("common_retry")}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            className={`rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2 text-meta font-medium text-slate-300 hover:bg-slate-700/60 motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            aria-label={t("common_backToHome")}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-slate-400 flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link
            href="/community"
            className={`inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-coral hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("header_community")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/orders"
            className={`inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-coral hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("nav_orders")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/pay"
            className={`inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-coral hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ref-sun/18 pt-5 text-meta text-slate-400"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-ref-sun hover:text-ref-coral hover:underline ${deepShellInlineLinkFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </div>
  );
}
