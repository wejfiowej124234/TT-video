"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  deepShellInlineLinkFocusClasses,
  deepShellPillControlFocusClasses,
} from "@/lib/travelLinkFocus";

/** 30 DID 排行榜 · 页面级错误边界（§8.6），避免单点报错导致整页白屏；文案 i18n */
export default function DidRankError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const appErrorRetryHintId = useId();

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("DID rank page error:", error?.message);
    }
  }, [error]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4"
      aria-labelledby={titleId}
    >
      <div className="rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md px-6 py-8 max-w-md text-center" role="alert">
        <h1 id={titleId} className="text-h4 font-semibold text-cyan-200">
          {t("didRank_errorTitle")}
        </h1>
        <p className="mt-2 text-small text-slate-300">
          {t("didRank_errorFallback")}
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
              aria-label={t("didRank_retry")}
              className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] ${deepShellPillControlFocusClasses}`}
            >
              {t("didRank_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("didRank_backToHome")}
            className={`inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2 text-meta font-medium text-slate-300 hover:bg-slate-700/60 motion-sub min-h-[44px] ${deepShellPillControlFocusClasses}`}
          >
            {t("didRank_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-slate-400 flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link
            href="/did-rank"
            className={`text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("header_didRank")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/orders"
            className={`text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("nav_orders")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/pay"
            className={`text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          >
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-cyan-500/20 pt-5 text-meta text-slate-400"
          linkClassName={`inline-flex min-h-[44px] items-center justify-center text-cyan-300 hover:text-cyan-100 hover:underline ${deepShellInlineLinkFocusClasses}`}
          separatorClassName="text-slate-500"
        />
      </div>
    </main>
  );
}
