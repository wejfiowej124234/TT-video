"use client";

import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

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
};

const DEFAULT_KEYS: readonly [string, string, string] = [
  "admin_fin_partial_check_common_01",
  "admin_fin_partial_check_common_02",
  "admin_fin_partial_check_common_03",
];

/** FIN-02 · ① partial 页内「能做什么 / ② 另闸」清单（非页内深度闭环）。 */
export function AdminFinanceSuitePartialChecklist() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  if (searchParams.get("fin_suite_depth") !== "partial") return null;

  const moduleId = searchParams.get("fin_suite_module") ?? "";
  const keys = MODULE_CHECK_KEYS[moduleId] ?? DEFAULT_KEYS;

  return (
    <section
      className="mb-4 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/60 p-4"
      aria-label={t("admin_fin_partial_checklist_aria")}
      data-tt-admin-fin-suite-partial-checklist="1"
      data-tt-admin-fin-suite-module={moduleId || undefined}
    >
      <h2 className="text-small font-semibold text-ink-900">{t("admin_fin_partial_checklist_title")}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink-700">
        {keys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </section>
  );
}
