"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  deepShellInlineLinkFocusClasses,
  deepShellPillControlFocusClasses,
  touchTargetLink44Classes,
} from "@/lib/travelLinkFocus";

/** 争议详情段 · 页面级错误边界；与 `disputes/error` 同壳；不向用户展示 `error.message`（96-13 13.8） */
export default function DisputeDetailSegmentError({
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
      console.error("Dispute detail segment error:", error?.message);
    }
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-ink-900 px-4 safe-area-inset-t safe-area-inset-b"
      role="alert"
      data-tt-error-boundary-root="disputes-detail"
    >
      <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/70 backdrop-blur-md px-6 py-8 max-w-md text-center">
        <p className="text-meta text-slate-500 mb-1">{t("disputes_meta_title")}</p>
        <h1 className="text-h4 font-semibold text-cyan-200">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-small text-slate-300">{t("common_errorMessage")}</p>
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
              className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] ${deepShellPillControlFocusClasses}`}
              aria-label={t("common_retry")}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            className={`inline-flex items-center justify-center rounded-full border border-slate-600 bg-ink-700/60 px-4 py-2 text-meta font-medium text-slate-300 hover:bg-ink-600/60 motion-sub min-h-[44px] ${deepShellPillControlFocusClasses}`}
            aria-label={t("common_backToHome")}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-slate-400 flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link
            href="/disputes"
            className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("disputes_listTitle")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/orders"
            className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("disputes_navOrders")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/pay"
            className={`${touchTargetLink44Classes} text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-cyan-500/20 pt-5 text-meta text-slate-400"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </div>
  );
}
