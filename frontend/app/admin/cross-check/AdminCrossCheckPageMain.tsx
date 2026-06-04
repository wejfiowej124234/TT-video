"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { NormalizedAdminCrossCheck, NormalizedCrossCheckSlot } from "@/lib/apiClient";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass, adminTableInlineLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_CROSS_CHECK_SLOT_DEFS,
  formatAdminCrossCheckUnknownJson,
} from "./adminCrossCheckPageModel";

function SlotBlock({
  title,
  slotIndexLabel,
  slot,
  sourceKindLabel,
  bodyLabel,
  testId,
  missingSourceKindLabel,
  anchorId,
}: {
  title: string;
  slotIndexLabel: string;
  slot: NormalizedCrossCheckSlot | undefined;
  sourceKindLabel: string;
  bodyLabel: string;
  testId: string;
  missingSourceKindLabel: string;
  anchorId: string;
}) {
  const sk = slot?.source_kind;
  return (
    <section
      id={anchorId}
      data-testid={testId}
      aria-label={`${slotIndexLabel} · ${title}`}
      className="scroll-mt-[5rem] rounded-[var(--radius-xl)] border border-ink-200 bg-white/60 p-5 shadow-sm dark:bg-bg-console/80"
    >
      <header className="border-b border-ink-100 pb-3">
        <p className="text-meta font-medium uppercase tracking-wide text-ink-500">{slotIndexLabel}</p>
        <h3 className="mt-1 font-mono text-body font-semibold text-ink-900">{title}</h3>
      </header>
      <div className="pt-4">
        <p className="text-meta text-ink-600">
          <span className="font-mono text-ink-700">{sourceKindLabel}</span>
          {": "}
          <span className="font-mono text-ink-900">{sk ?? missingSourceKindLabel}</span>
        </p>
        <p className="mt-2 text-meta font-medium text-ink-600">{bodyLabel}</p>
        <pre className="mt-2 max-h-[min(24rem,50vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
          {formatAdminCrossCheckUnknownJson(slot?.body)}
        </pre>
      </div>
    </section>
  );
}

/** Epic C-03 / C-05：三槽只读 JSON（C-02 归一化）；分区 + 页内导航；不解释业务字段、不做计算。 */
export default function AdminCrossCheckPageMain({
  loading,
  error,
  model,
}: {
  loading: boolean;
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
          <p className="mt-3">{t("admin_cross_check_subtitle")}</p>
        </>
      }
      headerAside={
        <Link
          href="/admin"
          className={`${adminPageNavLinkClass()} shrink-0`}
        >
          {t("admin_schema_back")}
        </Link>
      }
    >
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
        {loading ? (
          <AdminListLoadingStatus message={t("admin_cross_check_loading")} className="text-body text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : model ? (
          <div className="space-y-6">
            {model.status ? (
              <p className="font-mono text-meta text-ink-600">
                {t("admin_cross_check_status_label")}: <span className="text-ink-900">{model.status}</span>
              </p>
            ) : null}

            <section
              className="overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console shadow-sm"
              role="region"
              aria-labelledby={slotsRegionTitleId}
              data-testid="admin-cross-check-slots-region"
            >
              <div className="border-b border-ink-200 bg-ink-50/80 px-4 py-4 sm:px-5 dark:bg-ink-900/20">
                <h2 id={slotsRegionTitleId} className="text-h4 font-semibold text-ink-900">
                  {t("admin_cross_check_slots_region_heading")}
                </h2>
                <p className="mt-1 text-body text-ink-600">{t("admin_cross_check_slots_region_hint")}</p>
              </div>

              <nav
                className="border-b border-ink-200 bg-bg-console px-4 py-3 sm:px-5"
                aria-label={t("admin_cross_check_slots_jump_nav_aria")}
                data-testid="admin-cross-check-slots-jump-nav"
              >
                <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                  {ADMIN_CROSS_CHECK_SLOT_DEFS.map((def) => (
                    <li key={def.id}>
                      <a
                        href={`#cross-check-slot-${def.id}`}
                        className={`${adminTableInlineLinkClass()} inline-flex font-mono text-small`}
                      >
                        {t(def.titleKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-6 p-4 sm:p-5">
                {ADMIN_CROSS_CHECK_SLOT_DEFS.map((def) => (
                  <SlotBlock
                    key={def.id}
                    anchorId={`cross-check-slot-${def.id}`}
                    title={t(def.titleKey)}
                    slotIndexLabel={t("admin_cross_check_slot_index").replace("{n}", String(def.index))}
                    slot={def.pick(model)}
                    sourceKindLabel={t("admin_cross_check_source_kind")}
                    bodyLabel={t("admin_cross_check_raw_body")}
                    testId={`admin-cross-check-slot-${def.id}`}
                    missingSourceKindLabel={t("admin_em_dash")}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AdminListPageChrome>
  );
}
