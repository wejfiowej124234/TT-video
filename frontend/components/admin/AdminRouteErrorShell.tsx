"use client";

import { ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  errorBoundaryMotionSafeClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * Admin 子段共用错误壳（与 `app/admin/error.tsx` 同文案与 i18n；96-13 13.8 不向用户展示 `error.message`）。
 * `dataTtRoot` 用于生产观测区分段。
 */
export default function AdminRouteErrorShell({
  error,
  reset,
  dataTtRoot,
  logLabel,
  kickerKey = "admin_workspace_title",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  dataTtRoot: string;
  logLabel: string;
  kickerKey?: string;
}) {
  const { t } = useTranslation();
  const adminErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(`${logLabel}:`, error?.message, error?.digest);
    }
  }, [error, logLabel]);

  return (
    <main
      className={`mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main ${errorBoundaryMotionSafeClasses}`}
      role="alert"
      data-tt-error-boundary-root={dataTtRoot}
    >
      <div
        className={`rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft ${errorBoundaryMotionSafeClasses}`}
      >
        <p className="text-meta font-medium text-ink-500 mb-1">{t(kickerKey)}</p>
        <h1 className="text-h4 font-semibold text-ink-900">{t("common_errorTitle")}</h1>
        <p className="mt-2 text-body text-ink-600">{t("common_errorMessage")}</p>
        <p id={adminErrorRetryHintId} className="mt-3 text-meta text-ink-600 leading-relaxed text-center">
          {t("admin_error_boundary_retry_hint")}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <form
            className="inline"
            aria-describedby={adminErrorRetryHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS} ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <p className="mt-5 text-meta text-ink-600 text-center flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_workspace_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/orders"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("nav_orders")}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/pay"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("header_payHub")}
          </Link>
        </p>
        <ProductCrossNav
          ariaLabelKey="app_error_relatedNav_aria"
          showGuides
          errorBoundaryCrossNavMarker
          className="mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 border-t border-ink-200 pt-5 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
