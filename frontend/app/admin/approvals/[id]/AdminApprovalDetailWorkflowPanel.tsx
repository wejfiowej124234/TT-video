"use client";

import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import Link from "next/link";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_APPROVAL_APPROVE_ACTION_CLASS,
  ADMIN_APPROVAL_REJECT_ACTION_CLASS,
  ADMIN_APPROVAL_APPROVE_HEADING_CLASS,
  ADMIN_APPROVAL_REJECT_OUTLINE_BTN_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FORM_CONTROL_MD_CLASS,} from "@/lib/adminUi";

import { approvalActionLabelKey } from "../adminApprovalWorkflowModel";
import type { useAdminApprovalDetailPage } from "./useAdminApprovalDetailPage";

type Vm = ReturnType<typeof useAdminApprovalDetailPage>;

type Props = { vm: Vm };

export function AdminApprovalDetailWorkflowPanel({ vm }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const canAct = caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.APPROVE);

  const {
    row,
    isPending,
    approveNote,
    setApproveNote,
    rejectReason,
    setRejectReason,
    actionBusy,
    actionError,
    lastIdempotencyKey,
    runAction,
  } = vm;

  if (!row) return null;

  const actionKey = approvalActionLabelKey(
    typeof row.action === "string" ? row.action : undefined,
  );

  return (
    <AdminDetailContentPanel data-tt-admin-approval-workflow="1">
      <h2 className="text-body font-semibold text-ink-900">{t("admin_approval_workflow_title")}</h2>
      <p className="mt-1 text-meta text-ink-600">
        {t("admin_approval_workflow_action")}: {t(actionKey)}
      </p>

      {!canAct ? (
        <AdminNoticeBanner tone="readonly" className="mt-3" message={t("admin_perm_denied_approve")} />
      ) : null}

      {isPending && canAct ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={ADMIN_APPROVAL_APPROVE_ACTION_CLASS}>
            <h3 className={ADMIN_APPROVAL_APPROVE_HEADING_CLASS}>{t("admin_approvals_approve")}</h3>
            <label className="mt-2 block text-small text-ink-700">
              {t("admin_approvals_approve_note_label")}
              <textarea
                className={`mt-1 block w-full min-h-[88px] ${ADMIN_FORM_CONTROL_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder={t("admin_approvals_approvePh")}
              />
            </label>
            <button
              type="button"
              className={`mt-3 w-full disabled:opacity-50 ${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
              disabled={actionBusy !== null}
              aria-busy={actionBusy === "approve" ? true : undefined}
              onClick={() => void runAction("approve")}
            >
              {actionBusy === "approve" ? t("admin_approvals_approving") : t("admin_approvals_approve")}
            </button>
          </div>
          <div className={ADMIN_APPROVAL_REJECT_ACTION_CLASS}>
            <h3 className="text-small font-semibold text-danger">{t("admin_approvals_reject")}</h3>
            <label className="mt-2 block text-small text-ink-700">
              {t("admin_approvals_reject_reason_required")}
              <textarea
                className={`mt-1 block w-full min-h-[88px] ${ADMIN_FORM_CONTROL_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("admin_approvals_reject_ph")}
                required
              />
            </label>
            <button
              type="button"
              className={`mt-3 ${ADMIN_APPROVAL_REJECT_OUTLINE_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
              disabled={actionBusy !== null || !rejectReason.trim()}
              aria-busy={actionBusy === "reject" ? true : undefined}
              onClick={() => void runAction("reject")}
            >
              {actionBusy === "reject" ? t("admin_approvals_rejecting") : t("admin_approvals_reject")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-body text-ink-600">{t("admin_approval_workflow_closed")}</p>
      )}

      <p className="mt-3 text-meta text-ink-500">{t("admin_approvals_idempotency_hint")}</p>
      {lastIdempotencyKey ? (
        <p className="mt-1 font-mono text-meta text-ink-400 break-all">
          {t("admin_approval_last_idempotency")}: {lastIdempotencyKey.slice(0, 8)}…
        </p>
      ) : null}

      {actionError ? (
        <AdminListFetchError
          className="mt-3"
          errorKind={actionError}
          message={adminErrorUserText(actionError, t)}
        />
      ) : null}

      <p className="mt-4 text-small">
        <Link href="/admin/audit-logs" className={ADMIN_LINK_FOCUS_CLASS}>
          {t("admin_approval_audit_trail_link")}
        </Link>
      </p>
    </AdminDetailContentPanel>
  );
}
