"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_FINANCE_PERIODS,
  parseAdminFinancePeriod,
  type AdminFinancePeriod,
} from "@/lib/admin/adminFinancePeriod";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_TEXT_FOOTNOTE_CLASS } from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const PERIOD_LABEL_KEY: Record<AdminFinancePeriod, string> = {
  day: "admin_finance_period_day",
  week: "admin_finance_period_week",
  month: "admin_finance_period_month",
};

/** HU-280 · Shared day|week|month control (browse facet · not API filter). */
export function AdminFinancePeriodControl() {
  const { t } = useTranslation();
  const pathname = usePathname() || "/admin/finance";
  const searchParams = useSearchParams();
  const period = parseAdminFinancePeriod(searchParams.get("period"));

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-tt-admin-finance-period="1"
      data-tt-admin-finance-period-value={period}
    >
      <span className="text-small font-medium text-ink-700">{t("admin_finance_period_label")}</span>
      <div className="inline-flex flex-wrap gap-1" role="group" aria-label={t("admin_finance_period_label")}>
        {ADMIN_FINANCE_PERIODS.map((p) => {
          const sp = new URLSearchParams(searchParams.toString());
          sp.set("period", p);
          const href = `${pathname}?${sp.toString()}`;
          const active = p === period;
          return (
            <Link
              key={p}
              href={href}
              className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS} ${travelFocusRingOffset2Classes} ${
                active
                  ? "border-ref-sun/50 bg-ref-sun/15 font-semibold text-ink-900"
                  : "border-white/12 text-ink-600 hover:border-white/25"
              }`}
              data-tt-admin-finance-period-option={p}
              aria-current={active ? "true" : undefined}
            >
              {t(PERIOD_LABEL_KEY[p])}
            </Link>
          );
        })}
      </div>
      <p className={`w-full text-meta ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="note">
        {t("admin_finance_period_honesty_ed")}
      </p>
    </div>
  );
}
