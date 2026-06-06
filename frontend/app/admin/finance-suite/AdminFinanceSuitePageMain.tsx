"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { FINANCE_SUITE_MODULES } from "./adminFinanceSuitePageModel";
import { AdminFinanceWorkflowStrip } from "@/components/admin/AdminFinanceWorkflowStrip";
import { AdminFinanceSuiteSupplementStrip } from "@/components/admin/AdminFinanceSuiteSupplementStrip";
import { AdminFinancePspPhase2DepthNotice } from "@/components/admin/AdminFinancePspPhase2DepthNotice";
import { AdminFinanceSuiteHubDepthSection } from "@/components/admin/AdminFinanceSuiteHubDepthSection";
import { AdminFinanceSuiteModuleStatusBadge } from "./AdminFinanceSuiteModuleStatusBadge";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { FINANCE_SUITE_HUB_RELATED_FOLD_LINKS } from "@/lib/admin/adminFinanceRelatedFoldLinks";

export function AdminFinanceSuitePageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { canWrite: canFinance } = useAdminCanWrite(ADMIN_PERM.FINANCE_READ);

  return (
    <AdminDetailPageChrome
      titleId={titleId}
      title={t("admin_fin_suite_title")}
      subtitle={
        <p>{t("admin_fin_suite_subtitle_l5")}</p>
      }
      mainDataAttrs={{ "data-tt-admin-finance-suite": "1" }}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={FINANCE_SUITE_HUB_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="finance-suite-hub"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceWorkflowStrip />
      <AdminFinancePspPhase2DepthNotice />

      <ul
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-tt-admin-fin-suite-module-grid="1"
      >
        {FINANCE_SUITE_MODULES.map((m) => {
          const hasPerm = m.perm === ADMIN_PERM.READ || canFinance;
          const navOpen = hasPerm && (m.status === "active" || m.status === "partial");
          const href =
            m.status === "partial" ? adminFinancePartialDepthHref(m.href, m.id) : m.href;
          return (
            <AdminWarmL5Surface
              as="li"
              key={m.id}
              className="flex min-h-[12rem] flex-col"
              data-tt-admin-fin-suite-module={m.id}
              data-tt-admin-fin-suite-status={m.status}
              data-tt-admin-fin-suite-nav-blocked={navOpen ? undefined : "1"}
            >
              <h2 className="text-body font-semibold text-ink-900">{t(m.titleKey)}</h2>
              <p className="mt-1 text-small text-ink-600">{t(m.descKey)}</p>
              <p className="mt-2">
                <AdminFinanceSuiteModuleStatusBadge status={m.status} />
              </p>
              {m.status === "partial" ? (
                <p className="mt-2 text-meta text-ink-500">{t("admin_fin_suite_partial_hint")}</p>
              ) : null}
              {navOpen ? (
                <Link
                  href={href}
                  className={`mt-3 inline-block ${adminPageNavLinkClass()}`}
                  data-tt-admin-fin-suite-open={m.status === "partial" ? "partial" : "active"}
                >
                  {m.status === "partial"
                    ? t("admin_fin_suite_open_partial")
                    : t("admin_fin_suite_open")}
                </Link>
              ) : (
                <span className="mt-3 block text-small text-ink-400">{t("admin_permissions_no")}</span>
              )}
            </AdminWarmL5Surface>
          );
        })}
      </ul>
      <AdminFinanceSuiteHubDepthSection />
      <AdminFinanceSuiteSupplementStrip />
    </AdminDetailPageChrome>
  );
}
