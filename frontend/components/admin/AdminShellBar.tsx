"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 70 / 07 §5.6C：全 `/admin` 域粘性顶栏（Workspace · Observability · Cross-check · Drift summary · Site），与子页「返回 Admin 首页」并存 */
export default function AdminShellBar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const onWorkspace = pathname === "/admin";
  const onFinanceReconciliation =
    pathname === "/admin/finance-reconciliation" ||
    pathname.startsWith("/admin/finance-reconciliation/");
  const onObservability = pathname === "/admin/observability";
  const onCrossCheck = pathname === "/admin/cross-check";
  const onDriftSummary = pathname === "/admin/drift-summary";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-bg-console/95 backdrop-blur-sm supports-[backdrop-filter]:bg-bg-console/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small" aria-label={t("admin_shell_bar_aria")}>
          <Link
            href="/admin"
            className={`${touchTargetLink44Classes} font-medium motion-sub rounded-[var(--radius-sm)] ${onWorkspace ? "text-ink-900" : "text-travel-600 hover:text-travel-700 hover:underline"} ${travelFocusRingOffset2Classes}`}
            aria-current={onWorkspace ? "page" : undefined}
          >
            {t("admin_shell_nav_workspace")}
          </Link>
          <span className="text-ink-300 select-none" aria-hidden>
            ·
          </span>
          <Link
            href="/admin/finance-reconciliation"
            title={t("admin_audit_tools_read_only_scope")}
            className={`${touchTargetLink44Classes} font-medium motion-sub rounded-[var(--radius-sm)] ${onFinanceReconciliation ? "text-ink-900" : "text-travel-600 hover:text-travel-700 hover:underline"} ${travelFocusRingOffset2Classes}`}
            aria-current={onFinanceReconciliation ? "page" : undefined}
          >
            {t("admin_shell_nav_finance_reconciliation")}
          </Link>
          <span className="text-ink-300 select-none" aria-hidden>
            ·
          </span>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium motion-sub rounded-[var(--radius-sm)] ${onObservability ? "text-ink-900" : "text-travel-600 hover:text-travel-700 hover:underline"} ${travelFocusRingOffset2Classes}`}
            aria-current={onObservability ? "page" : undefined}
          >
            {t("admin_observability_title")}
          </Link>
          <span className="text-ink-300 select-none" aria-hidden>
            ·
          </span>
          <Link
            href="/admin/cross-check"
            title={t("admin_audit_tools_read_only_scope")}
            className={`${touchTargetLink44Classes} font-medium motion-sub rounded-[var(--radius-sm)] ${onCrossCheck ? "text-ink-900" : "text-travel-600 hover:text-travel-700 hover:underline"} ${travelFocusRingOffset2Classes}`}
            aria-current={onCrossCheck ? "page" : undefined}
          >
            {t("admin_shell_nav_cross_check")}
          </Link>
          <span className="text-ink-300 select-none" aria-hidden>
            ·
          </span>
          <Link
            href="/admin/drift-summary"
            title={t("admin_audit_tools_read_only_scope")}
            className={`${touchTargetLink44Classes} font-medium motion-sub rounded-[var(--radius-sm)] ${onDriftSummary ? "text-ink-900" : "text-travel-600 hover:text-travel-700 hover:underline"} ${travelFocusRingOffset2Classes}`}
            aria-current={onDriftSummary ? "page" : undefined}
          >
            {t("admin_shell_nav_drift_summary")}
          </Link>
          <span className="text-ink-300 select-none" aria-hidden>
            ·
          </span>
          <Link
            href="/"
            className={`${touchTargetLink44Classes} text-ink-600 hover:text-travel-600 motion-sub hover:underline rounded-[var(--radius-sm)] ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_shell_nav_site")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
