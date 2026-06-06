"use client";

import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const MODULE_CHECK_KEYS: Record<string, readonly [string, string, string]> = {
  "finance-summary": [
    "admin_fin_partial_check_settlement_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  export: [
    "admin_fin_partial_check_export_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  refunds: [
    "admin_fin_partial_check_refunds_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  indexer: [
    "admin_fin_partial_check_indexer_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  "reconcile-reports": [
    "admin_fin_partial_check_reconcile_reports_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  observability: [
    "admin_fin_partial_check_observability_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  "trust-growth": [
    "admin_fin_partial_check_trust_growth_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
  "alert-incidents": [
    "admin_fin_partial_check_alert_incidents_01",
    "admin_fin_partial_check_common_02",
    "admin_fin_partial_check_common_03",
  ],
};

const DEFAULT_KEYS: readonly [string, string, string] = [
  "admin_fin_partial_check_common_01",
  "admin_fin_partial_check_common_02",
  "admin_fin_partial_check_common_03",
];

/** FIN-02 · ① partial 页内「能做什么 / ② 另闸」清单（默认折叠 · 非页内深度闭环）。 */
export function AdminFinanceSuitePartialChecklist() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  if (searchParams.get("fin_suite_depth") !== "partial") return null;

  const moduleId = searchParams.get("fin_suite_module") ?? "";
  const keys = MODULE_CHECK_KEYS[moduleId] ?? DEFAULT_KEYS;

  return (
    <details
      className="mb-4"
      data-tt-admin-fin-suite-partial-checklist-fold="1"
      data-tt-admin-fin-suite-partial-checklist="1"
      data-tt-admin-fin-suite-module={moduleId || undefined}
    >
      <summary
        className={`${touchTargetLink44Classes} cursor-pointer list-none text-small font-semibold text-ink-900 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
      >
        {t("admin_fin_partial_checklist_title")}
      </summary>
      <AdminWarmL5Surface as="div" className="mt-2" aria-label={t("admin_fin_partial_checklist_aria")}>
        <ul className="list-disc space-y-1 pl-5 text-small text-ink-700">
          {keys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </AdminWarmL5Surface>
    </details>
  );
}
