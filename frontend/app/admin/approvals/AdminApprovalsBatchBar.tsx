"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,} from "@/lib/adminUi";

import type { AdminApprovalsPageViewModel } from "./useAdminApprovalsPage";

type Props = { vm: AdminApprovalsPageViewModel };

export function AdminApprovalsBatchBar({ vm }: Props) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const canAct = caps.permissionsLoaded && caps.hasPermission(ADMIN_PERM.APPROVE);

  const {
    selectedIds,
    batchReason,
    setBatchReason,
    batchBusy,
    batchApprove,
    exportPendingCsv,
    pendingInView,
    actionMessage,
  } = vm;

  if (!canAct || pendingInView.length === 0) return null;

  return (
    <div className={`mt-4 ${ADMIN_FILTER_CARD_CLASS}`} data-tt-admin-approvals-batch="1">
      <h2 className="text-body font-medium text-ink-800">{t("admin_approvals_batch_title")}</h2>
      <p className="mt-1 text-meta text-ink-600">{t("admin_approvals_batch_hint")}</p>
      <p className="mt-1 text-meta text-ink-500">{t("admin_approvals_idempotency_hint")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[12rem] text-small text-ink-700">
          {t("admin_approvals_batch_reason_label")}
          <input
            className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={batchReason}
            onChange={(e) => setBatchReason(e.target.value)}
            placeholder={t("admin_approvals_approvePh")}
          />
        </label>
        <button
          type="button"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS}`}
          disabled={selectedIds.size === 0 || batchBusy}
          aria-busy={batchBusy || undefined}
          onClick={() => void batchApprove()}
        >
          {batchBusy
            ? t("admin_approvals_approving")
            : t("admin_approvals_batch_approve", { count: String(selectedIds.size) })}
        </button>
        <button
          type="button"
          className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS}`}
          disabled={pendingInView.length === 0 || batchBusy}
          onClick={() => exportPendingCsv()}
        >
          {t("admin_approvals_export_csv")}
        </button>
      </div>
      {actionMessage ? (
        <p className="mt-2 text-meta text-ink-600" role="status">
          {t("admin_approvals_batch_result")}
        </p>
      ) : null}
    </div>
  );
}
