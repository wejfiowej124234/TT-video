"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_FIN_SUITE_MODULE_TO_WORKFLOW_STEP,
  ADMIN_FINANCE_SUPPLEMENT_PARTIAL_MODULES,
  ADMIN_FINANCE_WORKFLOW_STEPS,
} from "@/lib/admin/adminFinanceWorkflowModel";
import {
  adminFinanceWorkflowNextStep,
  adminFinanceWorkflowStepSnapshotKey,
} from "@/lib/admin/adminFinanceWorkflowNextStep";
import {
  adminFinanceWorkflowSnapshotValue,
  useAdminFinanceWorkflowSnapshots,
} from "@/lib/admin/useAdminFinanceWorkflowSnapshots";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_PENDING_COUNT_BADGE_CLASS,
  adminFilterChipClass,
  adminPageNavLinkClass,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** FIN-02 · ① partial 深度子页横向工作流导航（快照徽标 + 下一步 · 非 ② 页内全深度）。 */
export function AdminFinanceWorkflowCompactNav() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const snapshots = useAdminFinanceWorkflowSnapshots();

  if (searchParams.get("fin_suite_depth") !== "partial") return null;

  const moduleId = searchParams.get("fin_suite_module") ?? "";
  const activeStepId = ADMIN_FIN_SUITE_MODULE_TO_WORKFLOW_STEP[moduleId] ?? null;
  const nextStep = adminFinanceWorkflowNextStep(activeStepId);

  return (
    <AdminWarmL5Surface
      as="nav"
      className="mb-4"
      aria-label={t("admin_fin_workflow_compact_nav_aria")}
      data-tt-admin-fin-workflow-compact-nav="1"
      data-tt-admin-fin-workflow-compact-module={moduleId || undefined}
    >
      <p
        className="text-meta text-ink-600"
        data-tt-admin-fin-partial-depth-honesty="1"
        role="note"
      >
        {t("admin_fin_workflow_partial_honesty")} {t("admin_fin_workflow_compact_nav_hint")}
      </p>
      <div className="mt-2 flex flex-wrap justify-end">
        <Link
          href="/admin/finance-suite"
          className={`text-meta font-medium ${adminPageNavLinkClass()}`}
          data-tt-admin-fin-workflow-compact-hub="1"
        >
          {t("admin_fin_suite_back_hub")}
        </Link>
      </div>
      <ol className="mt-3 flex flex-wrap gap-2">
        {ADMIN_FINANCE_WORKFLOW_STEPS.map((step) => {
          const active = activeStepId === step.id;
          const snapKey = adminFinanceWorkflowStepSnapshotKey(step);
          const snapValue = snapKey ? adminFinanceWorkflowSnapshotValue(snapKey, snapshots) : null;
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-1 text-meta font-medium ${adminFilterChipClass(active)} ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                data-tt-admin-fin-workflow-compact-step={step.id}
              >
                <span>{t(step.titleKey)}</span>
                {snapKey ? (
                  <span
                    className={ADMIN_PENDING_COUNT_BADGE_CLASS}
                    data-tt-admin-fin-workflow-compact-snapshot={step.id}
                    title={t("admin_fin_workflow_snapshot_title")}
                  >
                    {snapshots.loading
                      ? "…"
                      : snapValue === null
                        ? "—"
                        : snapValue > 99
                          ? "99+"
                          : snapValue}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
      {nextStep ? (
        <p className="mt-3 text-small text-ink-700">
          {t("admin_fin_workflow_compact_next_label")}{" "}
          <Link
            href={nextStep.href}
            className={`font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-fin-workflow-compact-next="1"
          >
            {t(nextStep.titleKey)}
          </Link>
        </p>
      ) : null}
      {snapshots.error ? (
        <button
          type="button"
          className={`mt-2 text-meta font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          onClick={snapshots.reload}
          data-tt-admin-fin-workflow-compact-retry="1"
        >
          {t("admin_fin_workflow_snapshot_retry")}
        </button>
      ) : null}
      <div
        className={`mt-4 ${ADMIN_INNER_DIVIDER_CLASS} pt-3`}
        data-tt-admin-fin-workflow-compact-supplement="1"
      >
        <p className="text-meta font-medium text-ink-700">
          {t("admin_fin_workflow_compact_supplement_label")}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ADMIN_FINANCE_SUPPLEMENT_PARTIAL_MODULES.map((mod) => {
            const active = moduleId === mod.id;
            return (
              <li key={mod.id}>
                <Link
                  href={mod.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-[36px] items-center rounded-[var(--radius-sm)] border px-2 py-1 text-meta font-medium ${adminFilterChipClass(active)} ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                  data-tt-admin-fin-workflow-compact-supplement-step={mod.id}
                >
                  {t(mod.titleKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminWarmL5Surface>
  );
}
