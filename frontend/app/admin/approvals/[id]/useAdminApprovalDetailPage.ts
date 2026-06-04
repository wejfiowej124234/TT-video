import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF } from "@/lib/admin/adminInboxQueueHrefs";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, getIdempotencyKey, writeRequestHeaders } from "@/lib/apiClient";

import { buildApprovalTimeline } from "../adminApprovalWorkflowModel";
import { type AdminApprovalDetailRes } from "./adminApprovalDetailPageModel";

export function useAdminApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const approvalId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminApprovalDetailRes | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusy, setActionBusy] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState<AdminFetchErrorKind | null>(null);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!approvalId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-approval-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminApprovalDetailRes>(
      "AdminApprovalDetailPage",
      apiUrl(routes.admin.approvalById(approvalId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminApprovalDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [approvalId]);

  useEffect(() => {
    load();
  }, [load, reloadTick]);

  const row =
    body?.approval_request && typeof body.approval_request === "object" ? body.approval_request : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const timeline = row ? buildApprovalTimeline(row) : [];
  const status = String(row?.status ?? "").trim().toLowerCase();
  const isPending = status === "pending";

  const runAction = async (kind: "approve" | "reject") => {
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

  return {
    approvalId,
    loading,
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
