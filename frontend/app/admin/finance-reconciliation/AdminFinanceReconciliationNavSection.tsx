"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { FINANCE_RECONCILIATION_NAV_LINKS } from "./adminFinanceReconciliationPageModel";
import { adminPageNavLinkClass } from "@/lib/adminUi";
export function AdminFinanceReconciliationNavSection() {
  const { t } = useTranslation();

  return (
    <nav
      className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
      aria-label={t("admin_finance_reconciliation_nav_aria")}
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
    </nav>
  );
}
