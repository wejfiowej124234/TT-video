"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_ALERT_CRITICAL_ITEM_CLASS, ADMIN_ALERT_WARN_ITEM_CLASS } from "@/lib/adminUi";

import type { ObsBody } from "./adminTrustGrowthPageModel";

type AdminTrustGrowthAlertsSectionProps = {
  alerts: NonNullable<ObsBody["alerts"]>;
};

export function AdminTrustGrowthAlertsSection({ alerts }: AdminTrustGrowthAlertsSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className="rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4"
      aria-label={t("admin_trust_growth_section_alerts")}
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_trust_growth_section_alerts")}
      </h2>
      {alerts.length === 0 ? (
        <p className="mt-2 text-body text-ink-600">{t("admin_trust_growth_no_alerts")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((a, i) => {
            const sev = a.severity === "critical" ? "critical" : "warn";
            return (
              <li
                key={`${a.code}-${i}`}
                className={sev === "critical" ? ADMIN_ALERT_CRITICAL_ITEM_CLASS : ADMIN_ALERT_WARN_ITEM_CLASS}
              >
                <span className="font-mono font-semibold">{a.code}</span>
                {a.moment ? (
                  <span className="ml-2 text-meta">
                    · {a.moment}
                    {a.variant_id ? ` / ${a.variant_id}` : ""}
                  </span>
                ) : null}
                <div className="mt-1 text-meta">{a.detail}</div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
