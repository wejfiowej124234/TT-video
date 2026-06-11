"use client";

import { type Dispatch, type SetStateAction, useId, useMemo } from "react";

import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { adminTrustGrowthObsSnapshot } from "@/lib/admin/adminTrustGrowthObsSnapshot";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { AdminObservabilitySectionBackLinks } from "@/components/admin/AdminObservabilitySectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { observabilityPeerRelatedFoldLinks } from "@/lib/admin/adminObservabilityRelatedFoldLinks";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

import type { ObsBody } from "./adminTrustGrowthPageModel";
import { AdminTrustGrowthAlertsSection } from "./AdminTrustGrowthAlertsSection";
import { AdminTrustGrowthControlSection } from "./AdminTrustGrowthControlSection";
import { AdminTrustGrowthKpiSection } from "./AdminTrustGrowthKpiSection";
import { AdminTrustGrowthLoadErrorBlock } from "./AdminTrustGrowthLoadErrorBlock";
import { AdminTrustGrowthMetricsSection } from "./AdminTrustGrowthMetricsSection";
import { AdminTrustGrowthThresholdsSection } from "./AdminTrustGrowthThresholdsSection";
import { AdminTrustGrowthTimelineSection } from "./AdminTrustGrowthTimelineSection";
import { AdminTrustGrowthWriteNoticeBanner } from "./AdminTrustGrowthWriteNoticeBanner";
import { ADMIN_SHELL_SECONDARY_BTN_CLASS, ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LIST_REFRESHING_SURFACE_CLASS } from "@/lib/adminUi";

export type AdminTrustGrowthPageMainProps = {
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  data: ObsBody | null;
  draftFrozen: boolean;
  setDraftFrozen: Dispatch<SetStateAction<boolean>>;
  draftForce: boolean;
  setDraftForce: Dispatch<SetStateAction<boolean>>;
  capsText: string;
  setCapsText: Dispatch<SetStateAction<string>>;
  saving: boolean;
  rollbackBusy: boolean;
  actionError: string | null;
  actionErrorKind: AdminFetchErrorKind | null;
  load: () => void;
  applyControl: () => void;
  rollback: () => void;
};

export default function AdminTrustGrowthPageMain({
  loading,
  refreshing,
  error,
  data,
  draftFrozen,
  setDraftFrozen,
  draftForce,
  setDraftForce,
  capsText,
  setCapsText,
  saving,
  rollbackBusy,
  actionError,
  actionErrorKind,
  load,
  applyControl,
  rollback,
}: AdminTrustGrowthPageMainProps) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const controlSectionId = useId();

  const genHist = data?.generation_history ?? [];
  const alerts = data?.alerts ?? [];
  const moments = data?.metrics?.by_moment ?? [];
  const tgSnapshot = useMemo(() => adminTrustGrowthObsSnapshot(data), [data]);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_trust_growth_title")}
      subtitle={t("admin_trust_growth_subtitle_l5")}
      headerAside={<AdminObservabilitySectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={observabilityPeerRelatedFoldLinks("/admin/trust-growth")}
        ariaLabelKey="admin_observability_hub_related_aria"
        foldSummaryKey="admin_observability_hub_related_fold"
        dataTtFold="obs-trust-growth"
      />
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
          onClick={() => load()}
          disabled={loading && !data}
          data-tt-admin-trust-growth-refresh="1"
        >
          {t("admin_trust_growth_refresh")}
        </button>
      </div>
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.TRUST_GROWTH_WRITE}
        messageKey="admin_perm_denied_trust_growth_write"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        trustGrowth={{
          ...tgSnapshot,
          loading,
          error: Boolean(error),
        }}
      />
      <AdminTrustGrowthWriteNoticeBanner />
      <AdminTrustGrowthLoadErrorBlock loading={loading && !data} error={error} />
      {!error && (!loading || data) && data ? (
        <div
          className={`mt-6 space-y-8${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <AdminTrustGrowthKpiSection data={data} />
          <AdminTrustGrowthControlSection
            controlSectionId={controlSectionId}
            draftFrozen={draftFrozen}
            setDraftFrozen={setDraftFrozen}
            draftForce={draftForce}
            setDraftForce={setDraftForce}
            capsText={capsText}
            setCapsText={setCapsText}
            saving={saving}
            rollbackBusy={rollbackBusy}
            actionError={actionError}
            actionErrorKind={actionErrorKind}
            applyControl={applyControl}
            rollback={rollback}
          />
          <AdminTrustGrowthAlertsSection alerts={alerts} />
          <AdminTrustGrowthTimelineSection generationHistory={genHist} />
          <AdminTrustGrowthMetricsSection runtime={data.runtime} moments={moments} />
          <AdminTrustGrowthThresholdsSection thresholds={data.thresholds} />
        </div>
      ) : null}
    </AdminListPageChrome>
  );
}
