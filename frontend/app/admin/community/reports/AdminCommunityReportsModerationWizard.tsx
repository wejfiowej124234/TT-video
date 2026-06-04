"use client";

import { type FormEvent, useState } from "react";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import {
  adminModalPortalRootSheetClass,
  adminModalScrimClass,
} from "@/components/market/marketStudioModalLayout";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_STEP_MARKER_CLASS,
  adminWizardStepClass,
} from "@/lib/adminUi";
import type { LocaleTranslateFn } from "@/lib/i18n";
import {
  type AdminReportsWizardFieldErrors,
  adminReportsWizardFieldErrorKeys,
  validateAdminReportsWizardStep1,
  validateAdminReportsWizardStep2,
  validateAdminReportsWizardStep3,
} from "@/lib/admin/adminReportsModerationWizardValidation";
import { reportPenaltyActionLabel, reportStatusLabel } from "./adminCommunityReportsLabels";
import {
  MOD_STATUS_OPTIONS,
  PENALTY_ACTIONS,
  type ReportRow,
} from "./adminCommunityReportsTypes";

const WIZARD_STEPS = [1, 2, 3] as const;
export type ModerationWizardStep = (typeof WIZARD_STEPS)[number];

type Props = {
  t: LocaleTranslateFn;
  modDialogTitleId: string;
  modDialogDescId: string;
  modRow: ReportRow;
  step: ModerationWizardStep;
  setStep: (s: ModerationWizardStep) => void;
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
  setModFormError: (kind: AdminFetchErrorKind, message: string) => void;
  clearModFormError: () => void;
  modSubmitting: boolean;
};

export function AdminCommunityReportsModerationWizard(props: Props) {
  const {
    t,
    modDialogTitleId,
    modDialogDescId,
    modRow,
    step,
    setStep,
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
    setModFormError,
    clearModFormError,
    modSubmitting,
  } = props;

  const [fieldErrors, setFieldErrors] = useState<AdminReportsWizardFieldErrors>({});

  const fieldErrorMessage = (key: keyof AdminReportsWizardFieldErrors): string | null => {
    const code = fieldErrors[key];
    if (!code) return null;
    if (key === "expectedVer") return t("admin_reports_modBadVer");
    if (key === "notes") return t("admin_reports_wizard_notes_required");
    if (key === "penaltySubject") return t("admin_reports_wizard_penalty_subject_required");
    if (key === "penaltyReason") return t("admin_reports_wizard_penalty_reason_required");
    return null;
  };

  const applyStepErrors = (errors: AdminReportsWizardFieldErrors): boolean => {
    const keys = adminReportsWizardFieldErrorKeys(errors);
    setFieldErrors(errors);
    if (keys.length > 0) {
      setModFormError("invalid_request", t("admin_reports_wizard_step_invalid"));
      return false;
    }
    clearModFormError();
    return true;
  };

  const stepLabel = (n: ModerationWizardStep) =>
    n === 1
      ? t("admin_reports_wizard_step1")
      : n === 2
        ? t("admin_reports_wizard_step2")
        : t("admin_reports_wizard_step3");

  const goNext = () => {
    if (step === 1) {
      if (!applyStepErrors(validateAdminReportsWizardStep1(modExpectedVer))) return;
      setFieldErrors({});
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!applyStepErrors(validateAdminReportsWizardStep2(modNotes))) return;
      setFieldErrors({});
      if (modStatus === "resolved") setStep(3);
      else submitModeration();
      return;
    }
    if (
      !applyStepErrors(
        validateAdminReportsWizardStep3({
          modRecordPenalty,
          modPenaltySubject,
          modPenaltyReason,
        }),
      )
    ) {
      return;
    }
    setFieldErrors({});
    submitModeration();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
      closeMod();
      return;
    }
    if (sub?.name === "admin_modal_intent" && sub.value === "back" && step > 1) {
      setStep((step - 1) as ModerationWizardStep);
      return;
    }
    goNext();
  };

  const showPenaltyStep = modStatus === "resolved";

  return (
    <div
      className={adminModalPortalRootSheetClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={modDialogTitleId}
      aria-describedby={modDialogDescId}
      data-tt-admin-reports-wizard="1"
    >
      <AdminDialogScrim onClose={closeMod} />
      <AdminDialogFocusPanel
        onClose={closeMod}
        trapId="reports-wizard"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium"
      >
        <h2 id={modDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_reports_wizard_title")}
        </h2>
        <p id={modDialogDescId} className="mt-1 text-meta font-mono text-ink-600 break-all">
          {modRow.id}
        </p>

        <ol
          className="mt-4 flex gap-2"
          aria-label={t("admin_reports_wizard_nav_aria")}
          data-tt-admin-reports-wizard-step-indicator="1"
        >
          {WIZARD_STEPS.map((n) => {
            const hidden = n === 3 && !showPenaltyStep;
            if (hidden) return null;
            const active = step === n;
            const done = step > n;
            const canJumpBack = n < step;
            return (
              <li key={n} className="flex-1">
                <button
                  type="button"
                  disabled={!canJumpBack && !active}
                  className={`flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-2 py-2 text-left text-meta font-medium disabled:cursor-default ${adminWizardStepClass(active, done)} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
                  data-tt-admin-reports-wizard-step={n}
                  aria-current={active ? "step" : undefined}
                  onClick={() => {
                    if (canJumpBack) {
                      setFieldErrors({});
                      clearModFormError();
                      setStep(n);
                    }
                  }}
                >
                  <span className={ADMIN_STEP_MARKER_CLASS} aria-hidden>
                    {n}
                  </span>
                  <span>{stepLabel(n)}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {adminReportsWizardFieldErrorKeys(fieldErrors).length > 0 ? (
          <div
            className="mt-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50/80 p-3 text-small text-red-900"
            role="alert"
            aria-live="polite"
            data-tt-admin-reports-wizard-step-errors="1"
          >
            <p className="font-medium">{t("admin_reports_wizard_step_errors_title")}</p>
            <ul className="mt-1 list-disc pl-5">
              {adminReportsWizardFieldErrorKeys(fieldErrors).map((key) => {
                const msg = fieldErrorMessage(key);
                return msg ? <li key={key}>{msg}</li> : null;
              })}
            </ul>
          </div>
        ) : null}

        <form className="mt-4 space-y-3 text-small" onSubmit={onSubmit}>
          {step === 1 ? (
            <>
              <p className="text-meta text-ink-600">{t("admin_reports_wizard_step1_hint")}</p>
              <label className="block text-ink-700">
                {t("admin_reports_modExpectedVer")}
                <input
                  type="text"
                  inputMode="numeric"
                  value={modExpectedVer}
                  onChange={(e) => {
                    setModExpectedVer(e.target.value);
                    if (fieldErrors.expectedVer) setFieldErrors((prev) => ({ ...prev, expectedVer: undefined }));
                  }}
                  aria-invalid={fieldErrors.expectedVer ? true : undefined}
                  aria-describedby={fieldErrors.expectedVer ? "admin-reports-wizard-err-ver" : undefined}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-white px-2 py-1 font-mono ${ADMIN_FORM_FIELD_FOCUS_CLASS} ${
                    fieldErrors.expectedVer ? "border-red-400" : "border-ink-200"
                  }`}
                />
                {fieldErrors.expectedVer ? (
                  <p id="admin-reports-wizard-err-ver" className="mt-1 text-meta text-red-700">
                    {fieldErrorMessage("expectedVer")}
                  </p>
                ) : null}
              </label>
              <label className="block text-ink-700">
                {t("admin_reports_modStatus")}
                <select
                  value={modStatus}
                  onChange={(e) =>
                    setModStatus(e.target.value as (typeof MOD_STATUS_OPTIONS)[number])
                  }
                  className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                >
                  {MOD_STATUS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {reportStatusLabel(v, t)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-meta text-ink-600">{t("admin_reports_wizard_step2_hint")}</p>
              <label className="block text-ink-700">
                {t("admin_reports_modNotes")}
                <textarea
                  value={modNotes}
                  onChange={(e) => {
                    setModNotes(e.target.value);
                    if (fieldErrors.notes) setFieldErrors((prev) => ({ ...prev, notes: undefined }));
                  }}
                  rows={3}
                  aria-invalid={fieldErrors.notes ? true : undefined}
                  aria-describedby={fieldErrors.notes ? "admin-reports-wizard-err-notes" : undefined}
                  className={`mt-1 w-full min-h-[88px] rounded-[var(--radius-sm)] border bg-white px-2 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS} ${
                    fieldErrors.notes ? "border-red-400" : "border-ink-200"
                  }`}
                  placeholder={t("admin_reports_wizard_notes_ph")}
                />
                {fieldErrors.notes ? (
                  <p id="admin-reports-wizard-err-notes" className="mt-1 text-meta text-red-700">
                    {fieldErrorMessage("notes")}
                  </p>
                ) : null}
              </label>
              <label className="block text-ink-700">
                {t("admin_reports_modDisposition")}
                <input
                  type="text"
                  value={modDisposition}
                  onChange={(e) => setModDisposition(e.target.value)}
                  className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  placeholder={t("admin_reports_wizard_disposition_ph")}
                />
              </label>
            </>
          ) : null}

          {step === 3 && showPenaltyStep ? (
            <>
              <p className="text-meta text-ink-600">{t("admin_reports_wizard_step3_hint")}</p>
              <label className="flex items-center gap-2 text-ink-800">
                <input
                  type="checkbox"
                  checked={modRecordPenalty}
                  onChange={(e) => setModRecordPenalty(e.target.checked)}
                />
                {t("admin_reports_modRecordPenalty")}
              </label>
              {modRecordPenalty ? (
                <div className="space-y-2 rounded-[var(--radius-md)] border border-ink-100 bg-bg-console p-3">
                  <label className="block text-ink-700">
                    {t("admin_reports_modPenaltyAction")}
                    <select
                      value={modPenaltyAction}
                      onChange={(e) =>
                        setModPenaltyAction(e.target.value as (typeof PENALTY_ACTIONS)[number])
                      }
                      className={`mt-1 inline-flex w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                    >
                      {PENALTY_ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {reportPenaltyActionLabel(a, t)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-ink-700">
                    {t("admin_reports_modPenaltySubject")}
                    <input
                      type="text"
                      value={modPenaltySubject}
                      onChange={(e) => {
                        setModPenaltySubject(e.target.value);
                        if (fieldErrors.penaltySubject) {
                          setFieldErrors((prev) => ({ ...prev, penaltySubject: undefined }));
                        }
                      }}
                      aria-invalid={fieldErrors.penaltySubject ? true : undefined}
                      className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS} ${
                        fieldErrors.penaltySubject ? "border-red-400" : "border-ink-200"
                      }`}
                      placeholder={t("admin_reports_modPenaltySubjectPh")}
                      autoComplete="off"
                    />
                    {fieldErrors.penaltySubject ? (
                      <p className="mt-1 text-meta text-red-700">{fieldErrorMessage("penaltySubject")}</p>
                    ) : null}
                  </label>
                  <label className="block text-ink-700">
                    {t("admin_reports_modPenaltyReason")}
                    <input
                      type="text"
                      value={modPenaltyReason}
                      onChange={(e) => {
                        setModPenaltyReason(e.target.value);
                        if (fieldErrors.penaltyReason) {
                          setFieldErrors((prev) => ({ ...prev, penaltyReason: undefined }));
                        }
                      }}
                      aria-invalid={fieldErrors.penaltyReason ? true : undefined}
                      className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS} ${
                        fieldErrors.penaltyReason ? "border-red-400" : "border-ink-200"
                      }`}
                    />
                    {fieldErrors.penaltyReason ? (
                      <p className="mt-1 text-meta text-red-700">{fieldErrorMessage("penaltyReason")}</p>
                    ) : null}
                  </label>
                  <label className="block text-ink-700">
                    {t("admin_reports_modPenaltyExpires")}
                    <input
                      type="text"
                      value={modPenaltyExpires}
                      onChange={(e) => setModPenaltyExpires(e.target.value)}
                      className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                      placeholder={t("admin_reports_modPenaltyExpiresPh")}
                      autoComplete="off"
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

          {modError && modErrorKind ? (
            <AdminAlertError compact className="mt-3" message={modError} errorKind={modErrorKind} />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              {step > 1 ? (
                <button
                  type="submit"
                  name="admin_modal_intent"
                  value="back"
                  formNoValidate
                  className={`inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-bg-console ${ADMIN_FOCUS_RING_CORE_CLASS}`}
                >
                  {t("admin_reports_wizard_back")}
                </button>
              ) : null}
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-bg-console ${ADMIN_FOCUS_RING_CORE_CLASS}`}
              >
                {t("admin_reports_modCancel")}
              </button>
            </div>
            <button
              type="button"
              disabled={modSubmitting}
              aria-busy={modSubmitting || undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-60 ${ADMIN_FOCUS_RING_CORE_CLASS}`}
              onClick={() => goNext()}
            >
              {modSubmitting
                ? t("admin_reports_modSubmitting")
                : step === 3 || (step === 2 && !showPenaltyStep)
                  ? t("admin_reports_wizard_submit")
                  : t("admin_reports_wizard_next")}
            </button>
          </div>
        </form>
        <p className="mt-3 text-meta text-ink-500">{t("admin_approvals_idempotency_hint")}</p>
      </AdminDialogFocusPanel>
    </div>
  );
}
