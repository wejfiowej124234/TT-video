// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";

import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF } from "@/lib/admin/adminInboxQueueHrefs";
import { downloadAdminCsv } from "@/lib/admin/downloadAdminCsv";
import {
  defaultAdminListFetchSnapshot,
  useAdminStandardListFetch,
  type AdminStandardListBody,
} from "@/lib/admin/useAdminStandardListFetch";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, getIdempotencyKey, writeRequestHeaders } from "@/lib/apiClient";

import { filterApprovalsBySearch } from "./adminApprovalWorkflowModel";
import {
  type ApprovalItem,
  buildApprovalsListPath,
  clampApprovalLimit,
  parseApprovalsListQuery,
  parseApprovalsSearchQuery,
} from "./adminApprovalsPageModel";

function approvalsListSnapshot(body: AdminStandardListBody<ApprovalItem>) {
  const snap = defaultAdminListFetchSnapshot(body);
  const metaNote = snap.meta && typeof snap.meta.note === "string" ? snap.meta.note : null;
  const note = metaNote ?? (typeof body.note === "string" ? body.note : null);
  if (!note) return snap;
  return {
    ...snap,
    meta: snap.meta ? { ...snap.meta, note } : { note },
  };
}

export function useAdminApprovalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestConfirm = useAdminL5ConfirmRequest();
  const listQ = useMemo(
    () => parseApprovalsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const listSearch = useMemo(
    () => parseApprovalsSearchQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const listUrl = useMemo(
    () =>
      routes.admin.approvals({
        limit: listQ.limit,
        ...(listQ.status !== undefined ? { status: listQ.status } : {}),
      }),
    [listQ.limit, listQ.status],
  );

  const {
    items,
    appliedFilters,
    meta,
    loading,
    refreshing,
    error,
    setItems,
  } = useAdminStandardListFetch<ApprovalItem>({
    scope: "approvals",
    context: "AdminApprovalsPage.load",
    listUrl,
    refreshToken: reloadTick,
    toSnapshot: approvalsListSnapshot,
  });

  const note = useMemo(() => {
    if (meta && typeof meta.note === "string") return meta.note;
    return null;
  }, [meta]);

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftStatus, setDraftStatus] = useState(() => (listQ.status === undefined ? "" : listQ.status));
  const [draftSearch, setDraftSearch] = useState(listSearch);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftStatus(listQ.status === undefined ? "" : listQ.status);
    setDraftSearch(listSearch);
  }, [listQ.limit, listQ.status, listSearch]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchReason, setBatchReason] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<AdminFetchErrorKind | null>(null);

  const filteredItems = useMemo(
    () => filterApprovalsBySearch(items, listSearch),
    [items, listSearch],
  );

  const pendingInView = useMemo(
    () => filteredItems.filter((i) => (i.status ?? "").trim() === "pending"),
    [filteredItems],
  );

  const bumpReload = () => {
    setSelectedIds(new Set());
    setReloadTick((x) => x + 1);
  };

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampApprovalLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim();
    router.push(
      buildApprovalsListPath(
        {
          limit: lim,
          status: st === "" ? undefined : st,
        },
        draftSearch,
      ),
    );
  };

  const reset = () => {
    router.push(ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF);
  };

  const setStatusQuick = (status: string) => {
    router.push(
      buildApprovalsListPath(
        {
          limit: listQ.limit,
          status: status === "" ? undefined : status,
        },
        listSearch,
      ),
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPending = () => {
    const pendingIds = pendingInView.map((i) => i.id);
    setSelectedIds((prev) => {
      const allSelected = pendingIds.length > 0 && pendingIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(pendingIds);
    });
  };

  const postApprovalAction = async (
    id: string,
    kind: "approve" | "reject",
    reason: string | null,
    idempotencyKey: string,
  ): Promise<boolean> => {
    const url =
      kind === "approve"
        ? apiUrl(routes.admin.approvalApprove(id))
        : apiUrl(routes.admin.approvalReject(id));
    const { res, body } = await adminFetchJson<{ error?: string }>(
      kind === "approve" ? "AdminApprovalsPage.approve" : "AdminApprovalsPage.reject",
      url,
      {
        method: "POST",
        headers: {
          ...writeRequestHeaders(idempotencyKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      },
    );
    if (!res.ok) {
      throw new Error(body.error || `request_failed_${res.status}`);
    }
    return true;
  };

  const exportPendingCsv = () => {
    const headers = [
      "id",
      "action",
      "resource_type",
      "resource_id",
      "requested_by",
      "status",
      "reason",
      "created_at",
    ];
    const rows = pendingInView.map((item) => [
      item.id ?? "",
      item.action ?? "",
      item.resource_type ?? "",
      item.resource_id ?? "",
      item.requested_by ?? "",
      item.status ?? "",
      item.reason ?? "",
      item.created_at ?? "",
    ]);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadAdminCsv(`admin-approvals-pending-${ts}.csv`, headers, rows);
  };

  const batchApproveImpl = async () => {
    if (selectedIds.size === 0) return;
    setBatchBusy(true);
    setActionError(null);
    setActionMessage(null);
    const reason = batchReason.trim() || null;
    let ok = 0;
    let fail = 0;
    try {
      for (const id of selectedIds) {
        try {
          await postApprovalAction(id, "approve", reason, getIdempotencyKey());
          ok += 1;
        } catch (e: unknown) {
          logAdminFetch("AdminApprovalsPage.batchApprove", e);
          fail += 1;
        }
      }
      setActionMessage(`ok:${ok},fail:${fail}`);
      bumpReload();
    } catch (e: unknown) {
      logAdminFetch("AdminApprovalsPage.batchApprove", e);
      setActionError(adminFetchErrorKind(e));
    } finally {
      setBatchBusy(false);
    }
  };

  const batchApprove = useCallback(() => {
    if (selectedIds.size === 0) return;
    requestConfirm({
      titleKey: "admin_l5_confirm_title_approve",
      descKey: "admin_l5_confirm_desc_batch_approve",
      descVars: { count: selectedIds.size },
      onConfirm: () => batchApproveImpl(),
    });
  }, [requestConfirm, selectedIds]);

  const mergedError = actionError ?? error;

  return {
    listQ,
    listSearch,
    loading,
    refreshing,
    error: mergedError,
    items,
    filteredItems,
    pendingInView,
    note,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftSearch,
    setDraftSearch,
    selectedIds,
    batchReason,
    setBatchReason,
    batchBusy,
    actionMessage,
    apply,
    reset,
    setStatusQuick,
    toggleSelect,
    toggleSelectAllPending,
    batchApprove,
    exportPendingCsv,
    bumpReload,
    setItems,
  };
}

export type AdminApprovalsPageViewModel = ReturnType<typeof useAdminApprovalsPage>;
