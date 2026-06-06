"use client";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { useTranslation } from "@/components/LocaleProvider";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { escrowModalPortalRootClass } from "@/components/market/marketStudioModalLayout";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,} from "@/lib/adminUi";
type AdminSchedulerJobsRerunModalProps = {
  rerunCode: string;
  rerunDialogTitleId: string;
  rerunDialogDescId: string;
  rerunReasonInputId: string;
  rerunErrorId: string;
  rerunModalFilterHintId: string;
  rerunReason: string;
  setRerunReason: (v: string) => void;
  rerunError: string | null;
  rerunErrorKind: AdminFetchErrorKind | null;
  rerunSubmitting: boolean;
  closeRerun: () => void;
  submitRerun: () => void | Promise<void>;
};

export function AdminSchedulerJobsRerunModal({
  rerunCode,
  rerunDialogTitleId,
  rerunDialogDescId,
  rerunReasonInputId,
  rerunErrorId,
  rerunModalFilterHintId,
  rerunReason,
  setRerunReason,
  rerunError,
  rerunErrorKind,
  rerunSubmitting,
  closeRerun,
  submitRerun,
}: AdminSchedulerJobsRerunModalProps) {
  const { t } = useTranslation();

  return (
    <div
      className={escrowModalPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={rerunDialogTitleId}
      aria-describedby={rerunDialogDescId}
    >
      <AdminDialogScrim onClose={closeRerun} />
      <AdminDialogFocusPanel
        onClose={closeRerun}
        trapId="scheduler-rerun"
        className="relative z-10 w-full flex justify-center px-4"
      >
        <AdminModalWarmL5Panel className="max-w-md w-full">
        <h2 id={rerunDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_scheduler_rerunTitle")}
        </h2>
        <p id={rerunDialogDescId} className="mt-1 text-small text-ink-600">
          {t("admin_scheduler_rerunSuperHint")}
        </p>
        <p className="mt-2 font-mono text-meta text-ink-700 break-all">{rerunCode}</p>
        <p id={rerunModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
          {t("admin_scheduler_rerun_filter_hint")}
        </p>

        <form
          aria-describedby={rerunModalFilterHintId}
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closeRerun();
              return;
            }
            void submitRerun();
          }}
        >
          <label htmlFor={rerunReasonInputId} className="mt-4 block text-small text-ink-800">
            {t("admin_scheduler_rerunReason")}
            <input
              id={rerunReasonInputId}
              type="text"
              name="reason"
              value={rerunReason}
              onChange={(e) => setRerunReason(e.target.value)}
              aria-invalid={!!rerunError}
              aria-errormessage={rerunError ? rerunErrorId : undefined}
              className={`mt-1 min-h-[44px] w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_scheduler_rerunReasonPh")}
            />
          </label>

          {rerunError && rerunErrorKind ? (
            <AdminAlertError
              id={rerunErrorId}
              compact
              className="mt-3"
              message={rerunError}
              errorKind={rerunErrorKind}
            />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              name="admin_modal_intent"
              value="cancel"
              formNoValidate
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_scheduler_rerunCancel")}
            </button>
            <button
              type="submit"
              disabled={rerunSubmitting}
              aria-busy={rerunSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {rerunSubmitting ? t("admin_scheduler_rerunSubmitting") : t("admin_scheduler_rerunSubmit")}
            </button>
          </div>
        </form>
            </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>
  );
}
