"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import zh from "@/locales/zh";
import { ProductCrossNav, ProductCrossNavCore } from "@/components/nav/ProductCrossNav";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** 生产级：全局错误边界，避免白屏；06/13-1 异常态；不向用户展示 error.message（仅 console）；文案 i18n */
function ErrorContent({
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
      console.error("App error boundary:", error?.message);
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main" role="alert">
      <h1 className="text-h4 font-semibold text-ink-900">{t("common_errorTitle")}</h1>
      <p className="mt-2 text-body text-ink-600 text-center">
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
            className={`btn-console inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
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
    </main>
  );
}

/** 外层：无 Provider 时也能显示，避免白屏；使用默认 locale 文案 */
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  try {
    return <ErrorContent {...props} />;
  } catch {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main" role="alert">
        <h1 className="text-h4 font-semibold text-ink-900">{zh.common_errorTitle}</h1>
        <p className="mt-2 text-body text-ink-600 text-center">{zh.common_errorMessage}</p>
        <p id="app-root-error-fallback-retry-hint" className="mt-3 text-meta text-ink-600 leading-relaxed text-center">
          {zh.app_error_boundary_retry_hint}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <form
            className="inline"
            aria-describedby="app-root-error-fallback-retry-hint"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              props.reset();
            }}
          >
            <button
              type="submit"
              aria-label={zh.common_retry}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {zh.common_retry}
            </button>
          </form>
          <Link href="/" aria-label={zh.common_backToHome} className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}>{zh.common_backToHome}</Link>
        </div>
        <ProductCrossNavCore
          navAriaLabel={zh.app_error_relatedNav_aria}
          t={(k) => String((zh as Record<string, string>)[k] ?? k)}
          showGuides
          className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
        />
      </main>
    );
  }
}
