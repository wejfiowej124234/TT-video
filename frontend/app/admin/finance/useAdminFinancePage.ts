import { useEffect, useState } from "react";

import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import { type FinanceMeta, type FinanceRes, type FinanceSummary } from "./adminFinancePageTypes";

export type UseAdminFinancePageResult = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  exporting: boolean;
  exportError: AdminFetchErrorKind | null;
  meta: FinanceMeta | null;
  summary: FinanceSummary | null;
  downloadFinanceSummaryCsv: () => Promise<void>;
};

export function useAdminFinancePage(): UseAdminFinancePageResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);
  const [meta, setMeta] = useState<FinanceMeta | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = { "x-request-id": `admin-finance-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // Keep empty auth headers and let backend return 401/403.
    }

    adminFetchJson<FinanceRes>("AdminFinancePage", apiUrl(routes.admin.financeSummary), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setMeta(typeof body.meta === "object" && body.meta !== null ? body.meta : null);
        setSummary(body.summary ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminFinancePage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  async function downloadFinanceSummaryCsv() {
    setExportError(null);
    setExporting(true);
    try {
      const headers: Record<string, string> = { "x-request-id": `admin-finance-csv-${Date.now()}` };
      Object.assign(headers, getAuthHeaders());
      const res = await fetch(apiUrl(routes.admin.financeSummaryExport), { headers });
      if (!res.ok) {
        let msg = `request_failed_${res.status}`;
        try {
          const j = (await res.json()) as { message?: string; error?: string };
          if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
          else if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
        } catch {
          /* ignore non-JSON error bodies */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("Content-Disposition");
      const m = disp?.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = m?.[1] ?? "finance-summary.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      logAdminFetch("AdminFinanceExport", e);
      setExportError(adminFetchErrorKind(e));
    } finally {
      setExporting(false);
    }
  }

  return {
    loading,
    error,
    exporting,
    exportError,
    meta,
    summary,
    downloadFinanceSummaryCsv,
  };
}
