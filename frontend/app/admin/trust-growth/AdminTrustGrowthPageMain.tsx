"use client";

import Link from "next/link";
import { useId } from "react";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
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
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

export type AdminTrustGrowthPageMainProps = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  data: ObsBody | null;
  draftFrozen: boolean;
  setDraftFrozen: (v: boolean) => void;
  draftForce: boolean;
  setDraftForce: (v: boolean) => void;
  capsText: string;
  setCapsText: (v: string) => void;
  saving: boolean;
  rollbackBusy: boolean;
  actionError: string | null;
  actionErrorKind: AdminFetchErrorKind | null;
  load: () => void;
  applyControl: () => Promise<void>;
  rollback: () => Promise<void>;
};

export default function AdminTrustGrowthPageMain({
  loading,
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

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_trust_growth_title")}
      subtitle={t("admin_trust_growth_subtitle")}
      headerAside={
        <>
          <button
            type="button"
            className={`rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 py-2 text-small font-medium text-ink-800 hover:border-ink-400 ${ADMIN_LINK_FOCUS_CLASS}`}
            onClick={() => load()}
            disabled={loading}
          >
            {t("admin_trust_growth_refresh")}
          </button>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.TRUST_GROWTH_WRITE}
        messageKey="admin_perm_denied_trust_growth_write"
      />
      <AdminTrustGrowthWriteNoticeBanner />
      <AdminTrustGrowthLoadErrorBlock loading={loading} error={error} />
      {!loading && !error && data ? (
        <div className="mt-6 space-y-8">
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
