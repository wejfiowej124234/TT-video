"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { formatReportsAppliedFiltersHuman } from "./adminCommunityReportsLabels";
import { AdminCommunityReportsFilterCard } from "./AdminCommunityReportsFilterCard";
import { AdminCommunityReportsHeaderLinks } from "./AdminCommunityReportsHeaderLinks";
import { AdminCommunityReportsInboxStrip } from "./AdminCommunityReportsInboxStrip";
import { AdminCommunityReportsModerationWizard } from "./AdminCommunityReportsModerationWizard";
import { ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { AdminCommunityReportsTable } from "./AdminCommunityReportsTable";
import { buildReportsListPath } from "./adminCommunityReportsQuery";
import { useAdminCommunityReportsPage } from "./useAdminCommunityReportsPage";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";

/** 160 / 70：社区举报工单 + 审核 PATCH（须 admin + DB）。 */
export function AdminCommunityReportsPageInner() {
  const pageTitleId = useId();
  const modDialogTitleId = useId();
  const modDialogDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const communityReportsFilterLimitId = useId();
  const communityReportsFilterStatusId = useId();
  const communityReportsFilterReporterId = useId();
  const communityReportsFilterTargetTypeId = useId();
  const communityReportsFilterReasonCodeId = useId();
  const communityReportsFilterTargetId = useId();
  const router = useRouter();
  const { canWrite: canModerate } = useAdminCanWrite(ADMIN_PERM.COMMUNITY_MODERATE);

  const m = useAdminCommunityReportsPage();

  const filterIds = {
    adminListApplyResetHintId,
    adminAppliedFiltersDescId,
    communityReportsFilterLimitId,
    communityReportsFilterStatusId,
    communityReportsFilterReporterId,
    communityReportsFilterTargetTypeId,
    communityReportsFilterReasonCodeId,
    communityReportsFilterTargetId,
  };

  const appliedHuman = formatReportsAppliedFiltersHuman(m.appliedFilters, m.t);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={m.t("admin_community_reports_title")}
      subtitle={m.t("admin_community_reports_subtitle_l5")}
      headerAside={<AdminCommunityReportsHeaderLinks t={m.t} />}
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.COMMUNITY_MODERATE}
        messageKey="admin_perm_denied_community_moderate"
      />

      <AdminCommunityReportsInboxStrip
        t={m.t}
        openCount={m.openCount}
        totalShown={m.items.length}
        listStatus={m.listQ.status}
        onShowOpen={() =>
          router.push(
            buildReportsListPath({
              ...m.listQ,
              status: "open",
            }),
          )
        }
      />

      <AdminCommunityReportsFilterCard
        t={m.t}
        ids={filterIds}
        loading={m.loading}
        error={m.error}
        appliedFilters={m.appliedFilters}
        draftLimit={m.draftLimit}
        setDraftLimit={m.setDraftLimit}
        draftStatus={m.draftStatus}
        setDraftStatus={m.setDraftStatus}
        draftReporterId={m.draftReporterId}
        setDraftReporterId={m.setDraftReporterId}
        draftTargetType={m.draftTargetType}
        setDraftTargetType={m.setDraftTargetType}
        draftReasonCode={m.draftReasonCode}
        setDraftReasonCode={m.setDraftReasonCode}
        draftTargetId={m.draftTargetId}
        setDraftTargetId={m.setDraftTargetId}
        apply={m.apply}
        hasExtraFilters={m.hasExtraFilters}
        resetExtraFilters={m.resetExtraFilters}
      />

      {!m.loading && !m.error && appliedHuman ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {m.t("admin_community_reports_applied")}
          {appliedHuman}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={m.meta} loading={m.loading} error={m.error} />

      {m.loading ? (
        <AdminListLoadingStatus message={m.t("admin_community_reports_loading")} className="mt-6 text-body text-ink-500" />
      ) : null}

      {m.error && (
        <AdminListFetchError errorKind={m.error} message={adminErrorUserText(m.error, m.t)} />
      )}

      {!m.loading && !m.error && m.items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_community_reports_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_REPORTS_EMPTY}
          filteredEmpty={Boolean(appliedHuman)}
        />
      ) : null}

      {!m.loading && !m.error && m.items.length > 0 ? (
        <AdminCommunityReportsTable
          items={m.items}
          t={m.t}
          openMod={m.openMod}
          canModerate={canModerate}
        />
      ) : null}

      {m.modRow ? (
        <AdminCommunityReportsModerationWizard
          t={m.t}
          modDialogTitleId={modDialogTitleId}
          modDialogDescId={modDialogDescId}
          modRow={m.modRow}
          step={m.modWizardStep}
          setStep={m.setModWizardStep}
          closeMod={m.closeMod}
          submitModeration={m.submitModeration}
          modExpectedVer={m.modExpectedVer}
          setModExpectedVer={m.setModExpectedVer}
          modStatus={m.modStatus}
          setModStatus={m.setModStatus}
          modNotes={m.modNotes}
          setModNotes={m.setModNotes}
          modDisposition={m.modDisposition}
          setModDisposition={m.setModDisposition}
          modRecordPenalty={m.modRecordPenalty}
          setModRecordPenalty={m.setModRecordPenalty}
          modPenaltyAction={m.modPenaltyAction}
          setModPenaltyAction={m.setModPenaltyAction}
          modPenaltySubject={m.modPenaltySubject}
          setModPenaltySubject={m.setModPenaltySubject}
          modPenaltyReason={m.modPenaltyReason}
          setModPenaltyReason={m.setModPenaltyReason}
          modPenaltyExpires={m.modPenaltyExpires}
          setModPenaltyExpires={m.setModPenaltyExpires}
          modError={m.modError}
          modErrorKind={m.modErrorKind}
          setModFormError={m.setModFormError}
          clearModFormError={m.clearModFormError}
          modSubmitting={m.modSubmitting}
        />
      ) : null}
    </AdminListPageChrome>
  );
}
