"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** 首页 `(home)` · 页面级错误边界；Landing 组件树失败时可恢复，不依赖根 app/error 笼统兜底 */
export default function HomeError({
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
      console.error("Home page error:", error?.message);
    }
  }, [error]);

  return (
    <main className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 py-12" role="alert">
      <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/95 backdrop-blur-sm p-6 shadow-soft max-w-lg w-full">
        <p className="text-meta font-medium text-ink-500 mb-1">{t("header_web3Travel")}</p>
        <h1 className="text-h4 font-semibold text-ink-900">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-body text-ink-600">
          {t("common_errorMessage")}
        </p>
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
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
          className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
