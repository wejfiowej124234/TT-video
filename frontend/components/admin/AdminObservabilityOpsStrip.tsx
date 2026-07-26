"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_NOTICE_INFO_CLASS,
  ADMIN_WORKFLOW_INNER_CARD_CLASS,
} from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** ① 观测/对账工作流入口（链至既有页 · 非 ② 全矩阵 GO）。 */
const OPS_STEPS = [
  {
    id: "reconcile",
    titleKey: "admin_obs_ops_reconcile",
    descKey: "admin_obs_ops_reconcile_desc",
    href: "/admin/finance-reconciliation",
  },
  {
    id: "reports",
    titleKey: "admin_obs_ops_reports",
    descKey: "admin_obs_ops_reports_desc",
    href: "/admin/indexer/reconcile-reports",
  },
  {
    id: "drift",
    titleKey: "admin_obs_ops_drift",
    descKey: "admin_obs_ops_drift_desc",
    href: "/admin/drift-summary",
  },
  {
    id: "cross",
    titleKey: "admin_obs_ops_cross",
    descKey: "admin_obs_ops_cross_desc",
    href: "/admin/cross-check",
  },
] as const;

export function AdminObservabilityOpsStrip() {
  const { t } = useTranslation();

  return (
    <AdminWarmL5Surface
      as="section"
      className="mt-6"
      innerClassName="sm:p-6"
      aria-labelledby="admin-obs-ops-heading"
      data-tt-admin-observability-ops="1"
    >
      <h2 id="admin-obs-ops-heading" className="text-body font-semibold text-ink-900">
        {t("admin_obs_ops_title")}
      </h2>
      <p className={`mt-2 ${ADMIN_NOTICE_INFO_CLASS}`}>{t("admin_obs_ops_phase_note")}</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {OPS_STEPS.map((step, idx) => (
          <li
            key={step.id}
            className={ADMIN_WORKFLOW_INNER_CARD_CLASS}
            data-tt-admin-obs-ops-step={step.id}
          >
            <span className="text-meta font-medium text-ink-500">
              {t("admin_obs_ops_step", { n: idx + 1 })}
            </span>
            <h3 className="mt-1 text-small font-semibold text-ink-900">{t(step.titleKey)}</h3>
            <p className="mt-1 text-meta text-ink-600">{t(step.descKey)}</p>
            <Link
              href={step.href}
              className={`mt-2 inline-block text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_obs_ops_open")}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-small">
        <Link
          href="/admin/finance-suite"
          className={`font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-obs-finance-hub-link="1"
        >
          {t("admin_fin_suite_back_hub")}
        </Link>
      </p>
    </AdminWarmL5Surface>
  );
}
