import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF } from "@/lib/admin/adminInboxQueueHrefs";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { apiUrl, routes } from "@/lib/api";
import { getIdempotencyKey, writeRequestHeaders } from "@/lib/apiClient";

import { buildApprovalTimeline } from "../adminApprovalWorkflowModel";
import { type AdminApprovalDetailRes } from "./adminApprovalDetailPageModel";

export function useAdminApprovalDetailPage() {
  const router = useRouter();
  const requestConfirm = useAdminL5ConfirmRequest();
  const params = useParams();
  const approvalId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const [reloadTick, setReloadTick] = useState(0);
  const detailUrl = useMemo(
    () => (approvalId ? routes.admin.approvalById(approvalId) : ""),
    [approvalId],
  );

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminApprovalDetailRes>({
    scope: "approval-detail",
    context: "AdminApprovalDetailPage",
    detailUrl,
    resourceId: approvalId,
    refreshToken: reloadTick,
  });

  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusy, setActionBusy] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState<AdminFetchErrorKind | null>(null);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(null);

  const row =
    body?.approval_request && typeof body.approval_request === "object" ? body.approval_request : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const timeline = row ? buildApprovalTimeline(row) : [];
  const status = String(row?.status ?? "").trim().toLowerCase();
  const isPending = status === "pending";

  const runActionImpl = async (kind: "approve" | "reject") => {
    if (!approvalId) return;
    setActionBusy(kind);
    setActionError(null);
    const idem = getIdempotencyKey();
    setLastIdempotencyKey(idem);
    const reason =
      kind === "approve" ? approveNote.trim() || null : rejectReason.trim() || null;
    if (kind === "reject" && !reason) {
      setActionError(adminFetchErrorKind(new Error("admin_approval_reject_reason_required")));
      setActionBusy(null);
      return;
    }
    try {
      const url =
        kind === "approve"
          ? apiUrl(routes.admin.approvalApprove(approvalId))
          : apiUrl(routes.admin.approvalReject(approvalId));
      const { res, body: resBody } = await adminFetchJson<{ error?: string }>(
        kind === "approve" ? "AdminApprovalDetailPage.approve" : "AdminApprovalDetailPage.reject",
        url,
        {
          method: "POST",
          headers: {
            ...writeRequestHeaders(idem),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );
      if (!res.ok) {
        throw new Error(resBody.error || `request_failed_${res.status}`);
      }
      setReloadTick((x) => x + 1);
      router.push(ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF);
    } catch (e: unknown) {
      logAdminFetch(`AdminApprovalDetailPage.${kind}`, e);
      setActionError(adminFetchErrorKind(e));
    } finally {
      setActionBusy(null);
    }
  };

  const runAction = useCallback(
    (kind: "approve" | "reject") => {
      if (kind === "reject" && !rejectReason.trim()) {
        setActionError(adminFetchErrorKind(new Error("admin_approval_reject_reason_required")));
        return;
      }
      requestConfirm({
        titleKey: kind === "approve" ? "admin_l5_confirm_title_approve" : "admin_l5_confirm_title_reject",
        descKey:
          kind === "approve"
            ? "admin_l5_confirm_desc_approval_approve"
            : "admin_l5_confirm_desc_approval_reject",
        danger: kind === "reject",
        onConfirm: () => runActionImpl(kind),
      });
    },
    [rejectReason, requestConfirm],
  );

  return {
    approvalId,
    loading,
    refreshing,
    error,
    row,
    meta,
    timeline,
    isPending,
    approveNote,
    setApproveNote,
    rejectReason,
    setRejectReason,
    actionBusy,
    actionError,
    lastIdempotencyKey,
    runAction,
    reload: () => setReloadTick((x) => x + 1),
  };
}
