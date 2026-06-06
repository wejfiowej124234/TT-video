"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminFinanceSuiteModuleStatusBadge } from "@/app/admin/finance-suite/AdminFinanceSuiteModuleStatusBadge";
import { FINANCE_SUITE_MODULES } from "@/app/admin/finance-suite/adminFinanceSuitePageModel";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_FIN_SUITE_DEPTH_MODULE_CLASS, ADMIN_INLINE_LINK_CLASS, ADMIN_WARM_L5_FRAME_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** FIN-02 · ① 七件套枢纽「快速 partial」入口（仅主模块 · 旁路见下方折叠区）。 */
export function AdminFinanceSuiteHubDepthSection() {
  const { t } = useTranslation();
  const headingId = useId();
  const caps = useAdminCapabilities();

  return (
    <details
      className={`mt-8 overflow-hidden ${ADMIN_WARM_L5_FRAME_CLASS}`}
      data-tt-admin-fin-suite-hub-depth="1"
      data-tt-admin-fin-suite-hub-depth-fold="1"
    >
      <summary
        className={`${touchTargetLink44Classes} cursor-pointer list-none text-body-l font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
        id={headingId}
      >
        {t("admin_fin_suite_hub_depth_fold_summary")}
      </summary>
      <p className="mt-2 text-small text-ink-600">{t("admin_fin_suite_hub_depth_lead")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {FINANCE_SUITE_MODULES.map((m) => {
          const hasPerm =
            caps.permissionsLoaded &&
            !caps.capabilitiesUnavailable &&
            (m.perm === ADMIN_PERM.READ || caps.hasPermission(m.perm));
          const href = adminFinancePartialDepthHref(m.href, m.id);
          return (
            <li
              key={m.id}
              className={ADMIN_FIN_SUITE_DEPTH_MODULE_CLASS}
              data-tt-admin-fin-suite-hub-depth-module={m.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-small font-semibold text-slate-100">{t(m.titleKey)}</h3>
                <AdminFinanceSuiteModuleStatusBadge status={m.status} />
              </div>
              <p className="mt-1 text-meta text-slate-400">{t(m.descKey)}</p>
              {hasPerm ? (
                <Link
                  href={href}
                  className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
                  data-tt-admin-fin-suite-hub-depth-open="1"
                >
                  {t(m.openCtaKey)}
                </Link>
              ) : (
                <p className="mt-2 text-meta text-ink-500">{t("admin_permissions_no")}</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-small text-ink-600">
        <Link
          href="#admin-fin-suite-supplement-fold"
          className={`font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-fin-suite-hub-supplement-anchor="1"
        >
          {t("admin_fin_suite_hub_depth_supplement_link")}
        </Link>
      </p>
      <p className="mt-2 text-meta text-ink-500" role="note" data-tt-admin-fin-suite-hub-depth-honesty="1">
        {t("admin_fin_suite_hub_depth_honesty")}
      </p>
    </details>
  );
}
