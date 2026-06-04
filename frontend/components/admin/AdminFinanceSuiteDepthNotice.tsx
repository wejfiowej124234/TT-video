"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceWorkflowCompactNav } from "@/components/admin/AdminFinanceWorkflowCompactNav";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const FIN_SUITE_MODULE_TITLE_KEYS: Record<string, string> = {
  "finance-summary": "admin_fin_suite_settlement",
  export: "admin_fin_suite_export",
  refunds: "admin_fin_suite_refunds",
};

/** FIN-02 · ① 从七件套进入 partial 模块时的页内深度诚实条（非 ② 闭环）。 */
export function AdminFinanceSuiteDepthNotice() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const depth = searchParams.get("fin_suite_depth");
  const moduleId = searchParams.get("fin_suite_module") ?? "";

  if (depth !== "partial") return null;

  const moduleLabelKey = FIN_SUITE_MODULE_TITLE_KEYS[moduleId];
  const moduleLabel = moduleLabelKey ? t(moduleLabelKey) : moduleId || "—";

  return (
    <>
    <AdminNoticeBanner
      tone="readonly"
      size="md"
      className="mb-4"
      dataAttrs={{
        "data-tt-admin-fin-suite-depth-notice": "1",
        "data-tt-admin-fin-suite-module": moduleId || undefined,
      }}
      message={
        <div>
          <p>
            {t("admin_fin_suite_depth_notice", { module: moduleLabel })}{" "}
            <Link
              href="/admin/finance-suite"
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_fin_suite_back_hub")}
            </Link>
          </p>
          {moduleId === "export" ? (
            <p className="mt-2 text-meta text-ink-600" data-tt-admin-fin-suite-export-hint="1">
              {t("admin_fin_suite_depth_notice_export_hint")}
            </p>
          ) : null}
          {moduleId === "finance-summary" ? (
            <p className="mt-2 text-meta text-ink-600" data-tt-admin-fin-suite-settlement-hint="1">
              {t("admin_fin_suite_depth_notice_settlement_hint")}
            </p>
          ) : null}
          {moduleId === "refunds" ? (
            <p className="mt-2 text-meta text-ink-600" data-tt-admin-fin-suite-refunds-hint="1">
              {t("admin_fin_suite_depth_notice_refunds_hint")}
            </p>
          ) : null}
        </div>
      }
    />
    <AdminFinanceWorkflowCompactNav />
    </>
  );
}
