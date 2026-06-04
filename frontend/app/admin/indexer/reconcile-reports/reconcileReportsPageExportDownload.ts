import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import type { ProjectionCleanFilter, ReconcileExportJob } from "./reconcileReportsPageModel";

export type ReconcileReportsExportDownloadParams = {
  format: "csv" | "json";
  scope: "page" | "all";
  limit: number;
  offset: number;
  reportType: string;
  chainIdStr: string;
  projectionClean: ProjectionCleanFilter;
  issuesMinStr: string;
};

/** `GET …/admin/indexer/reconcile-reports/export` — blob 下载与文件名解析。 */
export async function downloadReconcileReportsExport(
  params: ReconcileReportsExportDownloadParams,
  setExportingFormat: (job: ReconcileExportJob) => void,
  setExportError: (e: AdminFetchErrorKind | null) => void,
): Promise<void> {
  const { format, scope, limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr } =
    params;
  const job: NonNullable<ReconcileExportJob> =
    scope === "all" ? (format === "json" ? "json_all" : "csv_all") : format;
  setExportError(null);
  setExportingFormat(job);
  try {
    const headers: Record<string, string> = {
      "x-request-id": `admin-reconcile-reports-${job}-${Date.now()}`,
    };
    Object.assign(headers, getAuthHeaders());
    const url = apiUrl(
      routes.admin.indexerReconcileReportsExport({
        format,
        ...(scope === "all" ? { exportScope: "all" as const } : {}),
        limit,
        ...(scope === "page" ? { offset } : {}),
        ...(reportType ? { report_type: reportType } : {}),
        ...(chainIdStr ? { chain_id: chainIdStr } : {}),
        ...(projectionClean === "true" || projectionClean === "false"
          ? { projection_reconcile_clean: projectionClean === "true" }
          : {}),
        ...(issuesMinStr ? { issues_min: Number.parseInt(issuesMinStr, 10) } : {}),
      }),
    );
    const res = await fetch(url, { headers });
    if (!res.ok) {
      let msg = `request_failed_${res.status}`;
      try {
        const j = (await res.json()) as { message?: string; error?: string };
        if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
        else if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
      } catch {
        /* ignore non-JSON */
      }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const disp = res.headers.get("Content-Disposition");
    const m = disp?.match(/filename="([^"]+)"/);
    a.href = blobUrl;
    a.download = m?.[1] ?? (format === "json" ? "reconcile-reports.json" : "reconcile-reports.csv");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e: unknown) {
    logAdminFetch("AdminIndexerReconcileReportsExport", e);
    setExportError(adminFetchErrorKind(e));
  } finally {
    setExportingFormat(null);
  }
}
