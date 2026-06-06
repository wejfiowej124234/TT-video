"use client";

import { type FormEvent } from "react";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { adminModalPortalRootSheetClass } from "@/components/market/marketStudioModalLayout";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_MODAL_CANCEL_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_CONSOLE_INNER_PANEL_CLASS,} from "@/lib/adminUi";
import {
  MOD_STATUS_OPTIONS,
  PENALTY_ACTIONS,
  type ReportRow,
} from "./adminCommunityReportsTypes";

export function AdminCommunityReportsModerationModal({
  t,
  modDialogTitleId,
  modDialogDescId,
  modModalFilterHintId,
  modRow,
  closeMod,
  submitModeration,
  modExpectedVer,
  setModExpectedVer,
  modStatus,
  setModStatus,
  modNotes,
  setModNotes,
  modDisposition,
  setModDisposition,
  modRecordPenalty,
  setModRecordPenalty,
  modPenaltyAction,
  setModPenaltyAction,
  modPenaltySubject,
  setModPenaltySubject,
  modPenaltyReason,
  setModPenaltyReason,
  modPenaltyExpires,
  setModPenaltyExpires,
  modError,
  modErrorKind,
  modSubmitting,
}: {
  t: (k: string) => string;
  modDialogTitleId: string;
  modDialogDescId: string;
  modModalFilterHintId: string;
  modRow: ReportRow;
  closeMod: () => void;
  submitModeration: () => void;
  modExpectedVer: string;
  setModExpectedVer: (v: string) => void;
  modStatus: (typeof MOD_STATUS_OPTIONS)[number];
  setModStatus: (v: (typeof MOD_STATUS_OPTIONS)[number]) => void;
  modNotes: string;
  setModNotes: (v: string) => void;
  modDisposition: string;
  setModDisposition: (v: string) => void;
  modRecordPenalty: boolean;
  setModRecordPenalty: (v: boolean) => void;
  modPenaltyAction: (typeof PENALTY_ACTIONS)[number];
  setModPenaltyAction: (v: (typeof PENALTY_ACTIONS)[number]) => void;
  modPenaltySubject: string;
  setModPenaltySubject: (v: string) => void;
  modPenaltyReason: string;
  setModPenaltyReason: (v: string) => void;
  modPenaltyExpires: string;
  setModPenaltyExpires: (v: string) => void;
  modError: string | null;
  modErrorKind: AdminFetchErrorKind | null;
  modSubmitting: boolean;
}) {
  return (
    <div
      className={adminModalPortalRootSheetClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modDialogTitleId}
      aria-describedby={modDialogDescId}
    >
      <AdminDialogScrim onClose={closeMod} />
      <AdminDialogFocusPanel
        onClose={closeMod}
        trapId="reports-moderation-legacy"
        className="relative z-10 w-full flex justify-center px-4"
      >
        <AdminModalWarmL5Panel className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 id={modDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_reports_modTitle")}
        </h2>
        <p id={modDialogDescId} className="mt-1 text-meta font-mono text-ink-600 break-all">
          {modRow.id}
        </p>
        <p id={modModalFilterHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
          {t("admin_reports_mod_filter_hint")}
        </p>

        <form
          aria-describedby={modModalFilterHintId}
          className="mt-4 space-y-3 text-small"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closeMod();
              return;
            }
            submitModeration();
          }}
        >
          <label className="block text-ink-700">
            {t("admin_reports_modExpectedVer")}
            <input
              type="text"
              name="expected_version"
              inputMode="numeric"
              value={modExpectedVer}
              onChange={(e) => setModExpectedVer(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_reports_modStatus")}
            <select
              name="status"
              value={modStatus}
              onChange={(e) => setModStatus(e.target.value as (typeof MOD_STATUS_OPTIONS)[number])}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {MOD_STATUS_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-ink-700">
            {t("admin_reports_modNotes")}
            <textarea
              name="admin_notes"
              value={modNotes}
              onChange={(e) => setModNotes(e.target.value)}
              rows={2}
              className={`mt-1 w-full min-h-[80px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className="block text-ink-700">
            {t("admin_reports_modDisposition")}
            <input
              type="text"
              name="disposition"
              value={modDisposition}
              onChange={(e) => setModDisposition(e.target.value)}
              className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>

          <div className={`${ADMIN_CONSOLE_INNER_PANEL_CLASS} p-3 space-y-2`}>
            <label className="flex items-center gap-2 text-ink-800">
              <input
                type="checkbox"
                name="record_penalty"
                checked={modRecordPenalty}
                onChange={(e) => setModRecordPenalty(e.target.checked)}
              />
              {t("admin_reports_modRecordPenalty")}
            </label>
            <p className="text-meta text-ink-500">{t("admin_reports_modRecordPenaltyHint")}</p>
            {modRecordPenalty ? (
              <>
                <label className="block text-ink-700">
                  {t("admin_reports_modPenaltyAction")}
                  <select
                    name="penalty_action"
                    value={modPenaltyAction}
                    onChange={(e) =>
                      setModPenaltyAction(e.target.value as (typeof PENALTY_ACTIONS)[number])
                    }
                    className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  >
                    {PENALTY_ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-ink-700">
                  {t("admin_reports_modPenaltySubject")}
                  <input
                    type="text"
                    name="penalty_subject_user_id"
                    value={modPenaltySubject}
                    onChange={(e) => setModPenaltySubject(e.target.value)}
                    className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                    placeholder={t("admin_reports_modPenaltySubjectPh")}
                    autoComplete="off"
                  />
                </label>
                <label className="block text-ink-700">
                  {t("admin_reports_modPenaltyReason")}
                  <input
                    type="text"
                    name="penalty_reason"
                    value={modPenaltyReason}
                    onChange={(e) => setModPenaltyReason(e.target.value)}
                    className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  />
                </label>
                <label className="block text-ink-700">
                  {t("admin_reports_modPenaltyExpires")}
                  <input
                    type="text"
                    name="penalty_expires_at"
                    value={modPenaltyExpires}
                    onChange={(e) => setModPenaltyExpires(e.target.value)}
                    className={`mt-1 w-full min-h-[44px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                    placeholder={t("admin_reports_modPenaltyExpiresPh")}
                    autoComplete="off"
                  />
                </label>
              </>
            ) : null}
          </div>

          {modError && modErrorKind ? (
            <AdminAlertError compact className="mt-3" message={modError} errorKind={modErrorKind} />
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
              disabled={modSubmitting}
              aria-busy={modSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {modSubmitting ? t("admin_reports_modSubmitting") : t("admin_reports_modSubmit")}
            </button>
          </div>
        </form>
            </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>
  );
}
