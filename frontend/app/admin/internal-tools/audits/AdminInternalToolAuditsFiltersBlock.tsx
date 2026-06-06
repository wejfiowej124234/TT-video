"use client";

import type { FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";
import {
  TOOL_AUDITS_ACTION_MAX,
  TOOL_AUDITS_ACTOR_MAX,
  TOOL_AUDITS_TOOL_ID_MAX,
} from "./adminInternalToolAuditsPageModel";

type AdminInternalToolAuditsFiltersBlockProps = {
  limitInputId: string;
  toolIdInputId: string;
  actionCodeInputId: string;
  actorIdInputId: string;
  approvalInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  toolAuditsActiveToolDescId: string;
  toolAuditsActiveActionDescId: string;
  toolAuditsActiveActorDescId: string;
  toolAuditsActiveApprovalDescId: string;
  adminAppliedFiltersDescId: string;
  appliedFilters: Record<string, unknown> | null;
  toolId: string;
  actionCode: string;
  actorId: string;
  approvalRequestId: string;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftToolId: string;
  setDraftToolId: (v: string) => void;
  draftActionCode: string;
  setDraftActionCode: (v: string) => void;
  draftActorId: string;
  setDraftActorId: (v: string) => void;
  draftApproval: string;
  setDraftApproval: (v: string) => void;
  apply: (e?: FormEvent) => void;
  clearNonLimitFilters: () => void;
  hasActiveFilters: boolean;
};

export function AdminInternalToolAuditsFiltersBlock({
  limitInputId,
  toolIdInputId,
  actionCodeInputId,
  actorIdInputId,
  approvalInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  toolAuditsActiveToolDescId,
  toolAuditsActiveActionDescId,
  toolAuditsActiveActorDescId,
  toolAuditsActiveApprovalDescId,
  adminAppliedFiltersDescId,
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
}: AdminInternalToolAuditsFiltersBlockProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
        <form
          id="admin-tool-audits-filter-form"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("admin_tool_audits_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              toolId ? toolAuditsActiveToolDescId : "",
              actionCode ? toolAuditsActiveActionDescId : "",
              actorId ? toolAuditsActiveActorDescId : "",
              approvalRequestId ? toolAuditsActiveApprovalDescId : "",
              appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className={`w-full ${ADMIN_FILTER_HINT_CLASS} sm:basis-full`}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tool_audits_limit")}
            </label>
            <input
              id={limitInputId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`mt-1 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </div>
          <div className="min-w-[9rem] flex-1">
            <label htmlFor={toolIdInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tool_audits_filter_tool_id")}
            </label>
            <input
              id={toolIdInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={TOOL_AUDITS_TOOL_ID_MAX}
              value={draftToolId}
              onChange={(e) => setDraftToolId(e.target.value.slice(0, TOOL_AUDITS_TOOL_ID_MAX))}
              placeholder={t("admin_tool_audits_filter_tool_id_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={actionCodeInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tool_audits_filter_action_code")}
            </label>
            <input
              id={actionCodeInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={TOOL_AUDITS_ACTION_MAX}
              value={draftActionCode}
              onChange={(e) => setDraftActionCode(e.target.value.slice(0, TOOL_AUDITS_ACTION_MAX))}
              placeholder={t("admin_tool_audits_filter_action_code_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label htmlFor={actorIdInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tool_audits_filter_actor_id")}
            </label>
            <input
              id={actorIdInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              maxLength={TOOL_AUDITS_ACTOR_MAX}
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value.slice(0, TOOL_AUDITS_ACTOR_MAX))}
              placeholder={t("admin_tool_audits_filter_actor_id_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <label htmlFor={approvalInputId} className="block text-small font-medium text-ink-600">
              {t("admin_tool_audits_filter_approval_id")}
            </label>
            <input
              id={approvalInputId}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftApproval}
              onChange={(e) => setDraftApproval(e.target.value)}
              placeholder={t("admin_tool_audits_filter_approval_id_placeholder")}
              autoComplete="off"
            />
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-tool-audits-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_tool_audits_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_tool_audits_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_tool_audits_filter_hint")}
      </p>
      {toolId ? (
        <p id={toolAuditsActiveToolDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_tool_id").replace("{id}", toolId)}
        </p>
      ) : null}
      {actionCode ? (
        <p id={toolAuditsActiveActionDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_action").replace("{action}", actionCode)}
        </p>
      ) : null}
      {actorId ? (
        <p id={toolAuditsActiveActorDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_actor").replace("{actor}", actorId)}
        </p>
      ) : null}
      {approvalRequestId ? (
        <p id={toolAuditsActiveApprovalDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_tool_audits_active_approval").replace("{id}", approvalRequestId)}
        </p>
      ) : null}
    </>
  );
}
