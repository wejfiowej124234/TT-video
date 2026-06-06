"use client";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { escrowModalPortalRootClass } from "@/components/market/marketStudioModalLayout";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_POLICY_PUBLISH_STATUSES,
  type AdminPolicyPublishStatus,
} from "./adminPoliciesPageConstants";
import type { AdminPolicyRow } from "./adminPoliciesPageTypes";
import {ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,} from "@/lib/adminUi";
type TFn = (key: string) => string;

export type AdminPoliciesPublishModalProps = {
  t: TFn;
  publishRow: AdminPolicyRow | null;
  closePublish: () => void;
  submitPublish: () => void;
  publishDialogTitleId: string;
  publishDialogDescId: string;
  publishModalFilterHintId: string;
  publishStatus: AdminPolicyPublishStatus;
  setPublishStatus: (v: AdminPolicyPublishStatus) => void;
  publishVersion: string;
  setPublishVersion: (v: string) => void;
  publishSubmitting: boolean;
  publishError: string | null;
  publishErrorKind: AdminFetchErrorKind | null;
};

export function AdminPoliciesPublishModal(props: AdminPoliciesPublishModalProps) {
  const {
    t,
    publishRow,
    closePublish,
    submitPublish,
    publishDialogTitleId,
    publishDialogDescId,
    publishModalFilterHintId,
    publishStatus,
    setPublishStatus,
    publishVersion,
    setPublishVersion,
    publishSubmitting,
    publishError,
    publishErrorKind,
  } = props;

  if (!publishRow) return null;

  return (
    <div
      className={escrowModalPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={publishDialogTitleId}
      aria-describedby={publishDialogDescId}
    >
      <AdminDialogScrim onClose={closePublish} />
      <AdminDialogFocusPanel
        onClose={closePublish}
        trapId="policies-publish"
        className="relative z-10 w-full flex justify-center px-4"
      >
        <AdminModalWarmL5Panel className="max-w-md w-full">
        <h2 id={publishDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_policies_publishTitle")}
        </h2>
        <p id={publishDialogDescId} className="mt-1 text-small text-ink-600">
          {t("admin_policies_publishSuperHint")}
        </p>
        <p className="mt-2 font-mono text-meta text-ink-700 break-all">{publishRow.policy?.code ?? publishRow.id}</p>
        <p id={publishModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
          {t("admin_policies_publish_filter_hint")}
        </p>

        <form
          aria-describedby={publishModalFilterHintId}
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            const sub = (e.nativeEvent as globalThis.SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closePublish();
              return;
            }
            void submitPublish();
          }}
        >
          <label className="mt-4 block text-small text-ink-800">
            {t("admin_policies_publishStatus")}
            <select
              name="status"
              value={publishStatus}
              onChange={(e) => setPublishStatus(e.target.value as AdminPolicyPublishStatus)}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {ADMIN_POLICY_PUBLISH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-small text-ink-800">
            {t("admin_policies_publishVer")}
            <input
              type="text"
              name="expected_version"
              inputMode="numeric"
              value={publishVersion}
              onChange={(e) => setPublishVersion(e.target.value)}
              className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-3 py-2 font-mono text-small`}
            />
          </label>

          {publishError && publishErrorKind ? (
            <AdminAlertError compact className="mt-3" message={publishError} errorKind={publishErrorKind} />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              name="admin_modal_intent"
              value="cancel"
              formNoValidate
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_policies_publishCancel")}
            </button>
            <button
              type="submit"
              disabled={publishSubmitting}
              aria-busy={publishSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
            >
              {publishSubmitting ? t("admin_policies_publishSubmitting") : t("admin_policies_publishSubmit")}
            </button>
          </div>
        </form>
            </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>
  );
}
