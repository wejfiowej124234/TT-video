"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { FINANCE_RECONCILIATION_NAV_LINKS } from "./adminFinanceReconciliationPageModel";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { adminPageNavLinkClass } from "@/lib/adminUi";
export function AdminFinanceReconciliationNavSection() {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="nav"
      className="mt-8"
      aria-label={t("admin_finance_reconciliation_nav_aria")}
      data-tt-admin-fin-reconciliation-nav="1"
    >
      <ul className="space-y-3">
        {FINANCE_RECONCILIATION_NAV_LINKS.map(({ href, labelKey }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${touchTargetLink44Classes} inline-flex ${adminPageNavLinkClass()}`}
            >
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </AdminWarmL5Surface>
  );
}
