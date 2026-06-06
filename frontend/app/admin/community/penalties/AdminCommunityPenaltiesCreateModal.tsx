"use client";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { adminModalPortalRootSheetClass } from "@/components/market/marketStudioModalLayout";
import type { CommunityPenaltyAction } from "./adminCommunityPenaltiesPageConstants";
import type { AdminCommunityPenaltiesPageViewModel } from "./useAdminCommunityPenaltiesPage";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_MODAL_CANCEL_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,} from "@/lib/adminUi";
type Props = Pick<
  AdminCommunityPenaltiesPageViewModel,
  | "t"
  | "showCreate"
  | "closeCreate"
  | "submitCreate"
  | "createDialogTitleId"
  | "createDialogDescId"
  | "createModalFilterHintId"
  | "cSubject"
  | "setCSubject"
  | "cAction"
  | "setCAction"
  | "cReportId"
  | "setCReportId"
  | "cReason"
  | "setCReason"
  | "cExpires"
  | "setCExpires"
  | "cMetaJson"
  | "setCMetaJson"
  | "cSubmitting"
  | "cError"
  | "cErrorKind"
  | "penaltyActions"
>;

export function AdminCommunityPenaltiesCreateModal({
  t,
  showCreate,
  closeCreate,
  submitCreate,
  createDialogTitleId,
  createDialogDescId,
  createModalFilterHintId,
  cSubject,
  setCSubject,
  cAction,
  setCAction,
  cReportId,
  setCReportId,
  cReason,
  setCReason,
  cExpires,
  setCExpires,
  cMetaJson,
  setCMetaJson,
  cSubmitting,
  cError,
  cErrorKind,
  penaltyActions,
}: Props) {
  if (!showCreate) return null;

  return (
    <div
      className={adminModalPortalRootSheetClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={createDialogTitleId}
      aria-describedby={createDialogDescId}
    >
      <AdminDialogScrim onClose={closeCreate} />
      <AdminDialogFocusPanel
        onClose={closeCreate}
        trapId="penalties-create"
        className="relative z-10 w-full flex justify-center px-4"
      >
        <AdminModalWarmL5Panel className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 id={createDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_penalties_createTitle")}
        </h2>
        <p id={createDialogDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_penalties_createSubtitle")}
        </p>
        <p id={createModalFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
          {t("admin_penalties_create_filter_hint")}
        </p>

        <form
          aria-describedby={createModalFilterHintId}
          className="mt-4 space-y-3 text-small"
          onSubmit={(e) => {
            e.preventDefault();
            const sub = (e.nativeEvent as globalThis.SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closeCreate();
              return;
            }
            submitCreate();
          }}
        >
          <label className="block text-ink-700">
            {t("admin_penalties_createSubject")}
            <input
              type="text"
              name="subject_user_id"
              value={cSubject}
              onChange={(e) => setCSubject(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              autoComplete="off"
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_penalties_createAction")}
            <select
              name="action"
              value={cAction}
              onChange={(e) => setCAction(e.target.value as CommunityPenaltyAction)}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {penaltyActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-ink-700">
            {t("admin_penalties_createReportId")}
            <input
              type="text"
              name="report_id"
              value={cReportId}
              onChange={(e) => setCReportId(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              autoComplete="off"
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_penalties_createReason")}
            <input
              type="text"
              name="reason"
              value={cReason}
              onChange={(e) => setCReason(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_penalties_createExpires")}
            <input
              type="text"
              name="expires_at"
              value={cExpires}
              onChange={(e) => setCExpires(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_reports_modPenaltyExpiresPh")}
              autoComplete="off"
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_penalties_createMeta")}
            <textarea
              name="metadata"
              value={cMetaJson}
              onChange={(e) => setCMetaJson(e.target.value)}
              rows={3}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_placeholder_json_empty")}
            />
          </label>

          {cError && cErrorKind ? (
            <AdminAlertError compact className="mt-3" message={cError} errorKind={cErrorKind} />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              name="admin_modal_intent"
              value="cancel"
              formNoValidate
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_MODAL_CANCEL_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_reports_modCancel")}
            </button>
            <button
              type="submit"
              disabled={cSubmitting}
              aria-busy={cSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {cSubmitting ? t("admin_penalties_createSubmitting") : t("admin_penalties_createSubmit")}
            </button>
          </div>
        </form>
            </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>
  );
}
