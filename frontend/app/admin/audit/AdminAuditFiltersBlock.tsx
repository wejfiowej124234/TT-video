"use client";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAuditLimitPresets } from "@/components/admin/AdminAuditLimitPresets";
import { AdminAuditQuickFilters } from "@/components/admin/AdminAuditQuickFilters";
import { buildAdminAuditLogsPath } from "@/lib/adminAuditLogsPath";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_4_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";
import type { AdminAuditPageViewModel } from "./useAdminAuditPage";

type Props = Pick<
  AdminAuditPageViewModel,
  | "listQ"
  | "loading"
  | "error"
  | "appliedFilters"
  | "draftLimit"
  | "setDraftLimit"
  | "draftActorId"
  | "setDraftActorId"
  | "draftAction"
  | "setDraftAction"
  | "draftResourceType"
  | "setDraftResourceType"
  | "apply"
  | "reset"
> & {
  adminListApplyResetHintId: string;
  adminAppliedFiltersDescId: string;
};

export function AdminAuditFiltersBlock({
  adminListApplyResetHintId,
  adminAppliedFiltersDescId,
  listQ,
  loading,
  error,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftActorId,
  setDraftActorId,
  draftAction,
  setDraftAction,
  draftResourceType,
  setDraftResourceType,
  apply,
  reset,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-audit-filter-form"
        aria-label={t("admin_audit_list_filters")}
        aria-describedby={
          [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_audit_list_filters")}</h2>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <AdminAuditQuickFilters
          currentAction={draftAction}
          onPick={(action) => setDraftAction(action)}
        />
        <AdminAuditLimitPresets
          currentLimit={listQ.limit}
          onPick={(n) =>
            router.push(
              buildAdminAuditLogsPath({
                limit: n,
                actor_id: draftActorId,
                action: draftAction,
                resource_type: draftResourceType,
              }),
            )
          }
        />
        <div className={ADMIN_FILTER_GRID_4_CLASS}>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_audit_list_actorId")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value)}
              placeholder={t("admin_audit_list_phActor")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_audit_list_action")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftAction}
              onChange={(e) => setDraftAction(e.target.value)}
              placeholder={t("admin_audit_list_phAction")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_audit_list_resourceType")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftResourceType}
              onChange={(e) => setDraftResourceType(e.target.value)}
              placeholder={t("admin_audit_list_phResourceType")}
            />
          </label>
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_audit_list_limit")}
            <input
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="number"
              min={1}
              max={200}
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              placeholder={t("admin_audit_list_phLimit")}
            />
          </label>
        </div>
      </form>
      <div className={ADMIN_FILTER_ACTIONS_CLASS}>
        <button form="admin-audit-filter-form" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} type="submit">
          {t("admin_audit_list_apply")}
        </button>
        <form
          className="inline"
          aria-describedby={adminListApplyResetHintId}
          onSubmit={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <button
            className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            type="submit"
          >
            {t("admin_audit_list_reset")}
          </button>
        </form>
      </div>
    </div>
  );
}
