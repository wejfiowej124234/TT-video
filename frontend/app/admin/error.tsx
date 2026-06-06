"use client";

import { type FormEvent, useEffect, useId } from "react";
import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  TT_ADMIN_ERROR_CARD,
  TT_ADMIN_ERROR_MAIN,
  adminErrorRetryBtnClass,
  adminErrorSecondaryBtnClass,
  adminPageNavLinkClass,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * /admin 路由 · 页面级错误边界。
 * 安全：不向用户展示 `error.message`（可能含内部路径或堆栈）；仅控制台记录。
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const adminErrorRetryHintId = useId();
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("Admin page error:", error?.message, error?.digest);
    }
  }, [error]);

  return (
    <main className={TT_ADMIN_ERROR_MAIN} role="alert">
      <div className={TT_ADMIN_ERROR_CARD}>
        <p className="text-meta font-medium text-ink-500 mb-1">{t("admin_workspace_title")}</p>
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-small font-medium ${adminErrorRetryBtnClass}`}
            >
              {t("common_retry")}
            </button>
          </form>
          <Link
            href="/"
            aria-label={t("common_backToHome")}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-small font-medium ${adminErrorSecondaryBtnClass}`}
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
          className={`mt-6 flex flex-wrap justify-center gap-x-2 gap-y-1 ${ADMIN_INNER_DIVIDER_CLASS} pt-5 text-meta text-ink-600`}
        />
      </div>
    </main>
  );
}
