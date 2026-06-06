"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminInternalToolAuditsPage } from "./useAdminInternalToolAuditsPage";
import { AdminInternalToolAuditsAppliedFiltersInline } from "./AdminInternalToolAuditsAppliedFiltersInline";
import { AdminInternalToolAuditsFiltersBlock } from "./AdminInternalToolAuditsFiltersBlock";
import { AdminInternalToolAuditsMetaSection } from "./AdminInternalToolAuditsMetaSection";
import { AdminInternalToolAuditsStatusBlock } from "./AdminInternalToolAuditsStatusBlock";
import { AdminInternalToolAuditsTableSection } from "./AdminInternalToolAuditsTableSection";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

/** 450 / 170：内部工具执行审计只读（须 admin + DB）。 */
export function AdminInternalToolAuditsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const toolIdInputId = useId();
  const actionCodeInputId = useId();
  const actorIdInputId = useId();
  const approvalInputId = useId();
  const adminFilterHintId = useId();
  const toolAuditsActiveToolDescId = useId();
  const toolAuditsActiveActionDescId = useId();
  const toolAuditsActiveActorDescId = useId();
  const toolAuditsActiveApprovalDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    toolId,
    actionCode,
    actorId,
    approvalRequestId,
    draftLimit,
    setDraftLimit,
    draftToolId,
    setDraftToolId,
    draftActionCode,
    setDraftActionCode,
    draftActorId,
    setDraftActorId,
    draftApproval,
    setDraftApproval,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  } = useAdminInternalToolAuditsPage();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_tool_audits_title")}
      subtitle={t("admin_tool_audits_subtitle_l5")}
      headerAside={
        <AdminInboxQueueBackLinks />
      }
    >
      <AdminInternalToolAuditsFiltersBlock
        limitInputId={limitInputId}
        toolIdInputId={toolIdInputId}
        actionCodeInputId={actionCodeInputId}
        actorIdInputId={actorIdInputId}
        approvalInputId={approvalInputId}
        adminListApplyResetHintId={adminListApplyResetHintId}
        adminFilterHintId={adminFilterHintId}
        toolAuditsActiveToolDescId={toolAuditsActiveToolDescId}
        toolAuditsActiveActionDescId={toolAuditsActiveActionDescId}
        toolAuditsActiveActorDescId={toolAuditsActiveActorDescId}
        toolAuditsActiveApprovalDescId={toolAuditsActiveApprovalDescId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        appliedFilters={appliedFilters}
        toolId={toolId}
        actionCode={actionCode}
        actorId={actorId}
        approvalRequestId={approvalRequestId}
        draftLimit={draftLimit}
        setDraftLimit={setDraftLimit}
        draftToolId={draftToolId}
        setDraftToolId={setDraftToolId}
        draftActionCode={draftActionCode}
        setDraftActionCode={setDraftActionCode}
        draftActorId={draftActorId}
        setDraftActorId={setDraftActorId}
        draftApproval={draftApproval}
        setDraftApproval={setDraftApproval}
        apply={apply}
        clearNonLimitFilters={clearNonLimitFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {appliedFilters ? (
        <AdminInternalToolAuditsAppliedFiltersInline id={adminAppliedFiltersDescId} appliedFilters={appliedFilters} />
      ) : null}

      <AdminInternalToolAuditsMetaSection meta={meta} loading={loading} error={error} />

      <AdminInternalToolAuditsStatusBlock loading={loading && items.length === 0} error={error} />

      {!error && (!loading || items.length > 0) ? (
        <AdminInternalToolAuditsTableSection items={items} refreshing={refreshing} />
      ) : null}
    </AdminListPageChrome>
  );
}
