"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import {
  getAdminCrossCheck,
  getAdminDriftSummary,
  getAuthHeaders,
  normalizeAdminCrossCheckRead,
  normalizeAdminDriftSummaryRead,
  type NormalizedAdminCrossCheck,
  type NormalizedAdminDriftSummary,
} from "@/lib/apiClient";
import { deriveChainAlignmentStatus, summarizeDeltaForHub } from "@/lib/financeReconciliationDriftStrip";
import {
  FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,
  FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS,
  FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS,
} from "@/lib/financeReconciliationHubPaths";
import {
  type FinanceRes,
  isRecord,
  pathRows,
} from "./adminFinanceReconciliationPageModel";

export type AdminFinanceReconciliationPageViewModel = {
  na: string;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  metaRows: { path: string; text: string }[];
  summaryRows: { path: string; text: string }[];
  lastRows: { path: string; text: string }[];
  hasReportId: boolean;
  reportIdRaw: string;
  driftStripLoading: boolean;
  crossErr: AdminFetchErrorKind | null;
  driftSummaryErr: AdminFetchErrorKind | null;
  crossNorm: NormalizedAdminCrossCheck | null;
  driftNorm: NormalizedAdminDriftSummary | null;
  hubAlignment: ReturnType<typeof deriveChainAlignmentStatus>;
  driftSummaryDeltaLine: string;
  crossDriftDeltaLine: string;
};

export function useAdminFinanceReconciliationPage(): AdminFinanceReconciliationPageViewModel {
  const { t } = useTranslation();
  const na = t("admin_finance_reconciliation_data_unavailable");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<FinanceRes | null>(null);

  const [driftStripLoading, setDriftStripLoading] = useState(true);
  const [crossErr, setCrossErr] = useState<AdminFetchErrorKind | null>(null);
  const [driftSummaryErr, setDriftSummaryErr] = useState<AdminFetchErrorKind | null>(null);
  const [crossNorm, setCrossNorm] = useState<NormalizedAdminCrossCheck | null>(null);
  const [driftNorm, setDriftNorm] = useState<NormalizedAdminDriftSummary | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = {
      "x-request-id": `admin-finance-reconciliation-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* 无本地凭证时交由后端 401/403 */
    }

    setLoading(true);
    setError(null);
    adminFetchJson<FinanceRes>("AdminFinanceReconciliationPage", apiUrl(routes.admin.financeSummary), {
      headers,
    })
      .then(({ res, body: b }) => {
        if (!res.ok) {
          throw new Error(b.error || `request_failed_${res.status}`);
        }
        return b;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminFinanceReconciliationPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDriftStripLoading(true);
    setCrossErr(null);
    setDriftSummaryErr(null);
    setCrossNorm(null);
    setDriftNorm(null);

    void Promise.allSettled([getAdminCrossCheck(), getAdminDriftSummary()]).then((results) => {
      if (cancelled) return;
      const [r0, r1] = results;
      if (r0.status === "fulfilled") {
        setCrossNorm(normalizeAdminCrossCheckRead(r0.value));
      } else {
        logAdminFetch("AdminFinanceReconciliationCrossCheck", r0.reason);
        setCrossErr(adminFetchErrorKind(r0.reason));
      }
      if (r1.status === "fulfilled") {
        setDriftNorm(normalizeAdminDriftSummaryRead(r1.value));
      } else {
        logAdminFetch("AdminFinanceReconciliationDriftSummary", r1.reason);
        setDriftSummaryErr(adminFetchErrorKind(r1.reason));
      }
      setDriftStripLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const meta = body && isRecord(body.meta) ? body.meta : null;
  const summary = body && isRecord(body.summary) ? body.summary : null;
  const lastStored =
    meta && isRecord(meta.last_stored_orders_projection_reconcile)
      ? meta.last_stored_orders_projection_reconcile
      : null;

  const reportIdRaw =
    lastStored && typeof lastStored.report_id === "string" ? lastStored.report_id.trim() : "";
  const hasReportId = reportIdRaw.length > 0;

  const metaRows = pathRows("meta", FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS, meta, na);
  const summaryRows = pathRows("summary", FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS, summary, na);
  const lastRows = pathRows(
    "meta.last_stored_orders_projection_reconcile",
    FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,
    lastStored,
    na,
  );

  const hubAlignment = deriveChainAlignmentStatus(driftNorm?.drift_detected);
  const driftSummaryDeltaLine = summarizeDeltaForHub(driftNorm?.delta, na);
  const crossDriftDeltaLine = summarizeDeltaForHub(crossNorm?.drift_summary?.delta, na);

  return {
    na,
    loading,
    error,
    metaRows,
    summaryRows,
    lastRows,
    hasReportId,
    reportIdRaw,
    driftStripLoading,
    crossErr,
    driftSummaryErr,
    crossNorm,
    driftNorm,
    hubAlignment,
    driftSummaryDeltaLine,
    crossDriftDeltaLine,
  };
}
