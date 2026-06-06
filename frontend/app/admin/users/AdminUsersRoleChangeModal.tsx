"use client";

import { AdminAlertError } from "@/components/admin/AdminAlertError";
import type { Dispatch, SetStateAction } from "react";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { AdminDialogFocusPanel } from "@/components/admin/AdminDialogFocusPanel";
import { AdminModalWarmL5Panel } from "@/components/admin/AdminModalWarmL5Panel";
import { AdminDialogScrim } from "@/components/admin/AdminDialogScrim";
import { escrowModalPortalRootClass } from "@/components/market/marketStudioModalLayout";
import { TARGET_ROLES } from "./adminUsersPageModel";
import type { AdminUser } from "./adminUsersPageTypes";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,} from "@/lib/adminUi";
export function AdminUsersRoleChangeModal({
  roleUser,
  roleChangeDialogTitleId,
  roleChangeDialogDescId,
  roleChangeModalFilterHintId,
  targetRole,
  setTargetRole,
  roleReason,
  setRoleReason,
  roleSubmitting,
  roleModalError,
  roleModalErrorKind,
  closeRoleModal,
  submitRoleChange,
  t,
}: {
  roleUser: AdminUser;
  roleChangeDialogTitleId: string;
  roleChangeDialogDescId: string;
  roleChangeModalFilterHintId: string;
  targetRole: string;
  setTargetRole: Dispatch<SetStateAction<string>>;
  roleReason: string;
  setRoleReason: Dispatch<SetStateAction<string>>;
  roleSubmitting: boolean;
  roleModalError: string | null;
  roleModalErrorKind: AdminFetchErrorKind | null;
  closeRoleModal: () => void;
  submitRoleChange: () => void;
  t: (key: string) => string;
}) {
  return (
    <div
      className={escrowModalPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={roleChangeDialogTitleId}
      aria-describedby={roleChangeDialogDescId}
    >
      <AdminDialogScrim onClose={closeRoleModal} />
      <AdminDialogFocusPanel
        onClose={closeRoleModal}
        trapId="users-role-change"
        className="relative z-10 w-full flex justify-center px-4"
      >
        <AdminModalWarmL5Panel className="max-w-md w-full">
        <h2 id={roleChangeDialogTitleId} className="text-body-l font-semibold text-ink-900">
          {t("admin_users_roleModalTitle")}
        </h2>
        <p id={roleChangeDialogDescId} className="mt-1 text-small text-ink-600">
          {t("admin_users_roleModalSubtitle")}
        </p>
        <p className="mt-2 font-mono text-meta text-ink-800 break-all">{roleUser.email}</p>
        <p className="mt-1 text-small text-ink-500">
          {t("admin_users_roleCurrent")}: <span className="font-medium text-ink-800">{roleUser.role}</span>
        </p>
        <p id={roleChangeModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
          {t("admin_users_role_modal_filter_hint")}
        </p>

        <form
          aria-describedby={roleChangeModalFilterHintId}
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
              closeRoleModal();
              return;
            }
            submitRoleChange();
          }}
        >
          <label className="mt-4 block text-small text-ink-800">
            {t("admin_users_roleTarget")}
            <select
              name="target_role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {TARGET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-small text-ink-800">
            {t("admin_users_roleReason")}
            <textarea
              name="reason"
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              placeholder={t("admin_users_roleReasonPh")}
              rows={3}
              className={`mt-1 w-full min-h-[80px] ${ADMIN_FORM_CONTROL_SM_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>

          {roleModalError && roleModalErrorKind ? (
            <AdminAlertError compact className="mt-3" message={roleModalError} errorKind={roleModalErrorKind} />
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              name="admin_modal_intent"
              value="cancel"
              formNoValidate
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_users_roleCancel")}
            </button>
            <button
              type="submit"
              disabled={roleSubmitting}
              aria-busy={roleSubmitting ? true : undefined}
              className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {roleSubmitting ? t("admin_users_roleSubmitting") : t("admin_users_roleSubmit")}
            </button>
          </div>
        </form>
            </AdminModalWarmL5Panel>
      </AdminDialogFocusPanel>
    </div>
  );
}
