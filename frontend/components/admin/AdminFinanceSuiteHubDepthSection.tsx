"use client";



import Link from "next/link";

import { useId } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceSuiteModuleStatusBadge } from "@/app/admin/finance-suite/AdminFinanceSuiteModuleStatusBadge";

import {

  FINANCE_SUITE_MODULES,

  FINANCE_SUITE_SUPPLEMENT_MODULES,

} from "@/app/admin/finance-suite/adminFinanceSuitePageModel";

import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_HOME_WIDGET_CARD_CLASS } from "@/lib/adminUi";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";



/** FIN-02 · ① 七件套枢纽页内深度入口（子页 partial 工作台 · 非 ② PSP 闭环）。 */

export function AdminFinanceSuiteHubDepthSection() {

  const { t } = useTranslation();

  const headingId = useId();

  const caps = useAdminCapabilities();



  return (

    <section

      className={`mt-8 ${ADMIN_HOME_WIDGET_CARD_CLASS}`}

      aria-labelledby={headingId}

      data-tt-admin-fin-suite-hub-depth="1"

    >

      <h2 id={headingId} className="text-body-l font-semibold text-ink-900">

        {t("admin_fin_suite_hub_depth_title")}

      </h2>

      <p className="mt-1 text-small text-ink-600">{t("admin_fin_suite_hub_depth_lead")}</p>

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

              className="rounded-[var(--radius-lg)] border border-ink-100 bg-ink-50/40 p-3"

              data-tt-admin-fin-suite-hub-depth-module={m.id}

            >

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="text-small font-semibold text-ink-900">{t(m.titleKey)}</h3>

                <AdminFinanceSuiteModuleStatusBadge status={m.status} />

              </div>

              <p className="mt-1 text-meta text-ink-600">{t(m.descKey)}</p>

              {hasPerm ? (

                <Link

                  href={href}

                  className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}

                  data-tt-admin-fin-suite-hub-depth-open="1"

                >

                  {t("admin_fin_suite_hub_depth_open")}

                </Link>

              ) : (

                <p className="mt-2 text-meta text-ink-500">{t("admin_permissions_no")}</p>

              )}

            </li>

          );

        })}

        {FINANCE_SUITE_SUPPLEMENT_MODULES.map((m) => (

          <li

            key={m.id}

            className="rounded-[var(--radius-lg)] border border-ink-100 bg-ink-50/40 p-3"

            data-tt-admin-fin-suite-hub-depth-module={m.id}

          >

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-small font-semibold text-ink-900">{t(m.titleKey)}</h3>

              <AdminFinanceSuiteModuleStatusBadge status="partial" />

            </div>

            <p className="mt-1 text-meta text-ink-600">{t(m.descKey)}</p>

            <Link

              href={adminFinancePartialDepthHref(m.href, m.id)}

              className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}

              data-tt-admin-fin-suite-hub-depth-open="1"

            >

              {t("admin_fin_suite_hub_depth_open")}

            </Link>

          </li>

        ))}

      </ul>

      <p className="mt-4 text-meta text-ink-500" role="note">

        {t("admin_fin_suite_hub_depth_honesty")}

      </p>

    </section>

  );

}


