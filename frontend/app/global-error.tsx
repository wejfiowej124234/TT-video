"use client";

/**
 * 根 layout 级错误边界（Next.js 要求自带 html/body；不经过 Providers / Header）。
 * 文案使用 zh 静态包，避免 LocaleProvider 未挂载时白屏。
 */
import "./globals.css";
import Link from "next/link";
import { type FormEvent, useEffect } from "react";
import zh from "@/locales/zh";
import { ProductCrossNavCore } from "@/components/nav/ProductCrossNav";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Global error boundary:", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-main text-ink-900 antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-12" role="alert">
          <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft w-full text-center">
            <h1 className="text-h4 font-semibold text-ink-900">{zh.common_errorTitle}</h1>
            <p className="mt-2 text-body text-ink-600">{zh.common_errorMessage}</p>
            <p id="global-error-retry-hint" className="mt-3 text-meta text-ink-600 leading-relaxed">
              {zh.app_error_boundary_retry_hint}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <form
                className="inline"
                aria-describedby="global-error-retry-hint"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  reset();
                }}
              >
                <button
                  type="submit"
                  aria-label={zh.common_retry}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                >
                  {zh.common_retry}
                </button>
              </form>
              <Link
                href="/"
                aria-label={zh.common_backToHome}
                className={`rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 inline-flex items-center ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {zh.common_backToHome}
              </Link>
            </div>
            <ProductCrossNavCore
              navAriaLabel={zh.app_error_relatedNav_aria}
              t={(k) => String((zh as Record<string, string>)[k] ?? k)}
              showGuides
              className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
            />
          </div>
        </main>
      </body>
    </html>
  );
}
