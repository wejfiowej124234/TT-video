"use client";

import {
  ADMIN_CONSOLE_ERROR_RETRY_BTN_CLASS,
  ADMIN_CONSOLE_ERROR_PANEL_CLASS,
  ADMIN_ERROR_SECONDARY_BTN_CLASS,
  adminPageNavLinkClass,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";
import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type KickerKey =
  | "admin_finance_title"
  | "admin_finance_reconciliation_title"
  | "admin_orders_title"
  | "admin_cross_check_title"
  | "admin_drift_summary_title"
  | "admin_guides_title";

/** Admin 子路由共用错误壳；不向用户展示 `error.message`（96-13 13.8） */
export default function AdminSubrouteError({
  error,
  reset,
  kickerKey,
  dataTtRoot,
  logLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  kickerKey: KickerKey;
  dataTtRoot: string;
  logLabel: string;
}) {
  const { t } = useTranslation();
  const adminErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error(`${logLabel} segment error:`, error?.message, error?.digest);
    }
  }, [error, logLabel]);

  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main"
      role="alert"
      data-tt-error-boundary-root={dataTtRoot}
    >
      <div className={ADMIN_CONSOLE_ERROR_PANEL_CLASS}>
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
            className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_ERROR_SECONDARY_BTN_CLASS} ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
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
          className={`mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 ${ADMIN_INNER_DIVIDER_CLASS} pt-5 text-meta text-ink-600`}
        />
      </div>
    </main>
  );
}
