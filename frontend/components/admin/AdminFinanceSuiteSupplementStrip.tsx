"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { FINANCE_SUITE_SUPPLEMENT_MODULES } from "@/app/admin/finance-suite/adminFinanceSuitePageModel";
import { adminFinancePartialDepthHref } from "@/lib/admin/adminFinancePartialDepthHref";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_HOME_WIDGET_CARD_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** FIN-02 · ① 七件套旁路深度页（drift · region-vault · 非 ② PSP 闭环）。 */
export function AdminFinanceSuiteSupplementStrip() {
  const { t } = useTranslation();

  return (
    <section
      className={`mt-6 ${ADMIN_HOME_WIDGET_CARD_CLASS}`}
      aria-labelledby="admin-fin-suite-supplement-heading"
      data-tt-admin-fin-suite-supplement="1"
    >
      <h2 id="admin-fin-suite-supplement-heading" className="text-body font-semibold text-ink-900">
        {t("admin_fin_suite_supplement_title")}
      </h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_fin_suite_supplement_lead")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {FINANCE_SUITE_SUPPLEMENT_MODULES.map((m) => (
          <li
            key={m.id}
            className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-3"
            data-tt-admin-fin-suite-supplement-module={m.id}
          >
            <h3 className="text-small font-semibold text-ink-900">{t(m.titleKey)}</h3>
            <p className="mt-1 text-meta text-ink-600">{t(m.descKey)}</p>
            <Link
              href={adminFinancePartialDepthHref(m.href, m.id)}
              className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
              data-tt-admin-fin-suite-supplement-open="partial"
            >
              {t("admin_fin_suite_hub_depth_open")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
