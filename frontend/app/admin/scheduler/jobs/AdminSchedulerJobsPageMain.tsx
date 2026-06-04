"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminSchedulerJobsPage } from "./useAdminSchedulerJobsPage";
import { AdminSchedulerJobsAppliedFiltersBanner } from "./AdminSchedulerJobsAppliedFiltersBanner";
import { AdminSchedulerJobsFiltersCard } from "./AdminSchedulerJobsFiltersCard";
import { AdminSchedulerJobsMetaAndNoteSection } from "./AdminSchedulerJobsMetaAndNoteSection";
import { AdminSchedulerJobsRerunModal } from "./AdminSchedulerJobsRerunModal";
import { AdminSchedulerJobsStatusBlock } from "./AdminSchedulerJobsStatusBlock";
import { AdminSchedulerJobsTableSection } from "./AdminSchedulerJobsTableSection";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 260：调度运行记录；补跑登记须 super_admin（04 §3.5）。 */
export function AdminSchedulerJobsPageMain() {
  const pageTitleId = useId();
  const limitInputId = useId();
  const jobCodeInputId = useId();
  const rerunDialogTitleId = useId();
  const rerunDialogDescId = useId();
  const rerunReasonInputId = useId();
  const rerunErrorId = useId();
  const rerunModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const schedulerActiveJobCodeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    jobCode,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftJobCode,
    setDraftJobCode,
    rerunCode,
    rerunReason,
    setRerunReason,
    rerunSubmitting,
    rerunError,
    rerunErrorKind,
    closeRerun,
    openRerun,
    submitRerun,
    apply,
    resetJobCodeFilter,
    hasJobCodeFilter,
    t,
  } = useAdminSchedulerJobsPage();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_scheduler_jobs_title")}
      subtitle={t("admin_scheduler_jobs_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_scheduler_jobs_back")}
          </Link>
        </>
      }
    >
      <AdminSchedulerJobsFiltersCard
        limitInputId={limitInputId}
        jobCodeInputId={jobCodeInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        schedulerActiveJobCodeDescId={schedulerActiveJobCodeDescId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        jobCode={jobCode}
        loading={loading}
        error={error}
        appliedFilters={appliedFilters}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftJobCode={draftJobCode}
        setDraftJobCode={setDraftJobCode}
        apply={apply}
        resetJobCodeFilter={resetJobCodeFilter}
        hasJobCodeFilter={hasJobCodeFilter}
      />

      {!loading && !error && appliedFilters ? (
        <AdminSchedulerJobsAppliedFiltersBanner id={adminAppliedFiltersDescId} appliedFilters={appliedFilters} />
      ) : null}

      <AdminSchedulerJobsStatusBlock loading={loading} error={error} />

      <AdminSchedulerJobsMetaAndNoteSection meta={meta} loading={loading} error={error} />

      {!loading && !error && <AdminSchedulerJobsTableSection items={items} openRerun={openRerun} />}

      {rerunCode ? (
        <AdminSchedulerJobsRerunModal
          rerunCode={rerunCode}
          rerunDialogTitleId={rerunDialogTitleId}
          rerunDialogDescId={rerunDialogDescId}
          rerunReasonInputId={rerunReasonInputId}
          rerunErrorId={rerunErrorId}
          rerunModalFilterHintId={rerunModalFilterHintId}
          rerunReason={rerunReason}
          setRerunReason={setRerunReason}
          rerunError={rerunError}
          rerunErrorKind={rerunErrorKind}
          rerunSubmitting={rerunSubmitting}
          closeRerun={closeRerun}
          submitRerun={submitRerun}
        />
      ) : null}
    </AdminListPageChrome>
  );
}
