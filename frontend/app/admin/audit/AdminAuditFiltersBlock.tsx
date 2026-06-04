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
} from "@/lib/adminUi";
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
        <h2 className="text-body font-medium text-ink-800">{t("admin_audit_list_filters")}</h2>
        <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-small text-ink-700">
            {t("admin_audit_list_actorId")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value)}
              placeholder={t("admin_audit_list_phActor")}
            />
          </label>
          <label className="text-small text-ink-700">
            {t("admin_audit_list_action")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftAction}
              onChange={(e) => setDraftAction(e.target.value)}
              placeholder={t("admin_audit_list_phAction")}
            />
          </label>
          <label className="text-small text-ink-700">
            {t("admin_audit_list_resourceType")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={draftResourceType}
              onChange={(e) => setDraftResourceType(e.target.value)}
              placeholder={t("admin_audit_list_phResourceType")}
            />
          </label>
          <label className="text-small text-ink-700">
            {t("admin_audit_list_limit")}
            <input
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
      <div className="mt-3 flex flex-wrap gap-2">
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
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            type="submit"
          >
            {t("admin_audit_list_reset")}
          </button>
        </form>
      </div>
    </div>
  );
}
