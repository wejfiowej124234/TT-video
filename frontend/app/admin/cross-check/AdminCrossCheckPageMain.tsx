"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminFinanceSuiteBackLinks } from "@/components/admin/AdminFinanceSuiteBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { NormalizedAdminCrossCheck, NormalizedCrossCheckSlot } from "@/lib/apiClient";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { adminPageNavLinkClass,
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_CROSS_CHECK_SLOTS_JUMP_NAV_CLASS,
  ADMIN_SECTION_HEADER_DIVIDER_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
import { financeGovernanceRelatedFoldLinks } from "@/lib/admin/adminFinanceGovernanceRelatedFoldLinks";
import {
  ADMIN_CROSS_CHECK_SLOT_DEFS,
  formatAdminCrossCheckUnknownJson,
} from "./adminCrossCheckPageModel";

function SlotBlock({
  title,
  slotId,
  slotIndexLabel,
  slot,
  sourceKindLabel,
  bodyLabel,
  technicalIdHint,
  testId,
  missingSourceKindLabel,
  anchorId,
}: {
  title: string;
  slotId: string;
  slotIndexLabel: string;
  slot: NormalizedCrossCheckSlot | undefined;
  sourceKindLabel: string;
  bodyLabel: string;
  technicalIdHint: string;
  testId: string;
  missingSourceKindLabel: string;
  anchorId: string;
}) {
  const sk = slot?.source_kind;
  return (
    <AdminWarmL5Surface
      as="section"
      id={anchorId}
      data-testid={testId}
      aria-label={`${slotIndexLabel} · ${title}`}
      className="scroll-mt-[5rem] shadow-sm"
      pad="default"
    >
      <header className={`${ADMIN_SECTION_HEADER_DIVIDER_CLASS}`}>
        <p className="text-meta font-medium uppercase tracking-wide text-ink-500">{slotIndexLabel}</p>
        <h3 className="mt-1 text-body font-semibold text-ink-900">{title}</h3>
        <p
          className="mt-0.5 font-mono text-meta text-ink-500"
          title={technicalIdHint}
          data-tt-admin-cross-check-slot-id={slotId}
        >
          {slotId}
        </p>
      </header>
      <div className="pt-4">
        <p className="text-small text-ink-600">
          <span className="font-medium text-ink-700">{sourceKindLabel}</span>
          {": "}
          <span className="font-mono text-ink-900">{sk ?? missingSourceKindLabel}</span>
        </p>
        <p className="mt-2 text-small font-medium text-ink-600">{bodyLabel}</p>
        <pre className={`mt-2 ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`} data-tt-admin-gov-json-block="1">
          {formatAdminCrossCheckUnknownJson(slot?.body)}
        </pre>
      </div>
    </AdminWarmL5Surface>
  );
}

/** Epic C-03 / C-05：三槽只读 JSON（C-02 归一化）；分区 + 页内导航；不解释业务字段、不做计算。 */
export default function AdminCrossCheckPageMain({
  loading,
  refreshing,
  error,
  model,
}: {
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  model: NormalizedAdminCrossCheck | null;
}) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const slotsRegionTitleId = useId();
  const slotCount = model ? ADMIN_CROSS_CHECK_SLOT_DEFS.length : 0;

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_cross_check_title")}
      subtitle={
        <>
          <AdminNoticeBanner
            tone="readonly"
            size="lg"
            message={t("admin_audit_tools_read_only_scope")}
            data-testid="admin-audit-read-only-scope"
          />
          <p className="mt-3">{t("admin_cross_check_subtitle_l5")}</p>
        </>
      }
      headerAside={<AdminFinanceSuiteBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={financeGovernanceRelatedFoldLinks("/admin/cross-check")}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="fin-governance-cross-check"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        crossCheck={{
          status: model?.status ?? null,
          slotCount,
          loading,
          error: Boolean(error),
        }}
      />

      <div className="mt-6 space-y-4">
        {loading && !model ? (
          <AdminListLoadingStatus message={t("admin_cross_check_loading")} className="text-body text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : model ? (
          <div
            className={`space-y-6${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
          >
            {model.status ? (
              <p className="font-mono text-small text-ink-800 text-ink-600">
                {t("admin_cross_check_status_label")}: <span className="text-ink-900">{model.status}</span>
              </p>
            ) : null}

            <AdminWarmL5Surface
              as="section"
              className="overflow-hidden shadow-sm"
              role="region"
              aria-labelledby={slotsRegionTitleId}
              data-testid="admin-cross-check-slots-region"
              pad="none"
            >
              <div className="border-b border-ref-sun/14 bg-ref-sun/5 px-4 py-4 sm:px-5">
                <h2 id={slotsRegionTitleId} className="text-h4 font-semibold text-ink-900">
                  {t("admin_cross_check_slots_region_heading")}
                </h2>
                <p className="mt-1 text-body text-ink-600">{t("admin_cross_check_slots_region_hint")}</p>
              </div>

              <nav
                className={ADMIN_CROSS_CHECK_SLOTS_JUMP_NAV_CLASS}
                aria-label={t("admin_cross_check_slots_jump_nav_aria")}
                data-testid="admin-cross-check-slots-jump-nav"
              >
                <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                  {ADMIN_CROSS_CHECK_SLOT_DEFS.map((def) => (
                    <li key={def.id}>
                      <a
                        href={`#cross-check-slot-${def.id}`}
                        className={`${adminPageNavLinkClass()} inline-flex text-small`}
                      >
                        {t(def.titleKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div
                className="space-y-6 p-4 sm:p-5"
                data-tt-admin-gov-json-single-scroll="1"
              >
                {ADMIN_CROSS_CHECK_SLOT_DEFS.map((def) => (
                  <SlotBlock
                    key={def.id}
                    anchorId={`cross-check-slot-${def.id}`}
                    slotId={def.id}
                    title={t(def.titleKey)}
                    slotIndexLabel={t("admin_cross_check_slot_index").replace("{n}", String(def.index))}
                    slot={def.pick(model)}
                    sourceKindLabel={t("admin_cross_check_source_kind")}
                    bodyLabel={t("admin_cross_check_raw_body")}
                    technicalIdHint={t("admin_cross_check_slot_technical_id_hint")}
                    testId={`admin-cross-check-slot-${def.id}`}
                    missingSourceKindLabel={t("admin_em_dash")}
                  />
                ))}
              </div>
            </AdminWarmL5Surface>
          </div>
        ) : (
          <AdminListPageEmptyState
            messageKey="admin_list_empty_cross_check"
            nextLinks={[{ href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" }]}
          />
        )}
      </div>
    </AdminListPageChrome>
  );
}
