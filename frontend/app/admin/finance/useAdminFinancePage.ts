import { useMemo, useState } from "react";



import {

  type AdminFetchErrorKind,

  adminFetchErrorKind,

  logAdminFetch,

} from "@/lib/adminFetchDisplay";

import { apiUrl, routes } from "@/lib/api";

import { getAuthHeaders } from "@/lib/apiClient";

import {

  type AdminListFetchSnapshot,

  type AdminStandardListBody,

  useAdminStandardListFetch,

} from "@/lib/admin/useAdminStandardListFetch";



import { ADMIN_FINANCE_BODY_META_KEY } from "./adminFinancePageModel";

import { type FinanceMeta, type FinanceRes, type FinanceSummary } from "./adminFinancePageTypes";



function financeBodyToSnapshot(

  body: AdminStandardListBody<never> & FinanceRes,

): AdminListFetchSnapshot<never> {

  return {

    items: [],

    appliedFilters: null,

    meta: { [ADMIN_FINANCE_BODY_META_KEY]: body },

  };

}



export type UseAdminFinancePageResult = {

  loading: boolean;

  refreshing: boolean;

  error: AdminFetchErrorKind | null;

  exporting: boolean;

  exportError: AdminFetchErrorKind | null;

  meta: FinanceMeta | null;

  summary: FinanceSummary | null;

  downloadFinanceSummaryCsv: () => Promise<void>;

};



export function useAdminFinancePage(): UseAdminFinancePageResult {

  const [exporting, setExporting] = useState(false);

  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);



  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({

    scope: "finance-summary",

    context: "AdminFinancePage",

    listUrl: routes.admin.financeSummary,

    toSnapshot: financeBodyToSnapshot,

  });



  const body = useMemo((): FinanceRes | null => {

    const raw = rawMeta?.[ADMIN_FINANCE_BODY_META_KEY];

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {

      return raw as FinanceRes;

    }

    return null;

  }, [rawMeta]);



  const meta = useMemo(

    (): FinanceMeta | null =>

      body?.meta && typeof body.meta === "object" && body.meta !== null ? body.meta : null,

    [body],

  );



  const summary = useMemo((): FinanceSummary | null => body?.summary ?? null, [body]);



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

    refreshing,

    error,

    exporting,

    exportError,

    meta,

    summary,

    downloadFinanceSummaryCsv,

  };

}


