"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdminFinanceWorkflowSnapshotKey } from "@/lib/admin/adminFinanceWorkflowModel";
import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

export type AdminFinanceWorkflowSnapshots = {
  loading: boolean;
  error: boolean;
  settlementOrders: number | null;
  openDisputes: number | null;
  crossCheckSlots: number | null;
  reload: () => void;
};

function authHeaders(): Record<string, string> {
  try {
    return { "x-request-id": `admin-fin-workflow-${Date.now()}`, ...getAuthHeaders() };
  } catch {
    return { "x-request-id": `admin-fin-workflow-${Date.now()}` };
  }
}

/** FIN-02 · ① 工作流条 live 快照（列表 API 投影 · 非全库 KPI）。 */
export function useAdminFinanceWorkflowSnapshots(): AdminFinanceWorkflowSnapshots {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [settlementOrders, setSettlementOrders] = useState<number | null>(null);
  const [openDisputes, setOpenDisputes] = useState<number | null>(null);
  const [crossCheckSlots, setCrossCheckSlots] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const headers = authHeaders();

    const summaryP = adminFetchJson<{ summary?: { order_count?: number } }>(
      "AdminFinanceWorkflowSummary",
      apiUrl(routes.admin.financeSummary),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) throw new Error("summary_failed");
        const n = body.summary?.order_count;
        setSettlementOrders(typeof n === "number" ? n : null);
      })
      .catch((e) => {
        logAdminFetch("AdminFinanceWorkflowSummary", e);
        setSettlementOrders(null);
        setError(true);
      });

    const disputesP = adminFetchJson<{ items?: unknown[] }>(
      "AdminFinanceWorkflowDisputes",
      apiUrl(routes.admin.disputes({ limit: 100, status: "open" })),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) throw new Error("disputes_failed");
        setOpenDisputes(Array.isArray(body.items) ? body.items.length : 0);
      })
      .catch((e) => {
        logAdminFetch("AdminFinanceWorkflowDisputes", e);
        setOpenDisputes(null);
        setError(true);
      });

    const crossP = adminFetchJson<{ slots?: unknown[] }>(
      "AdminFinanceWorkflowCrossCheck",
      apiUrl(routes.admin.crossCheck),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) throw new Error("cross_failed");
        setCrossCheckSlots(Array.isArray(body.slots) ? body.slots.length : 0);
      })
      .catch((e) => {
        logAdminFetch("AdminFinanceWorkflowCrossCheck", e);
        setCrossCheckSlots(null);
        setError(true);
      });

    void Promise.all([summaryP, disputesP, crossP]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    error,
    settlementOrders,
    openDisputes,
    crossCheckSlots,
    reload: load,
  };
}

export function adminFinanceWorkflowSnapshotValue(
  key: AdminFinanceWorkflowSnapshotKey,
  snapshots: AdminFinanceWorkflowSnapshots,
): number | null {
  if (key === "settlementOrders") return snapshots.settlementOrders;
  if (key === "openDisputes") return snapshots.openDisputes;
  return snapshots.crossCheckSlots;
}
