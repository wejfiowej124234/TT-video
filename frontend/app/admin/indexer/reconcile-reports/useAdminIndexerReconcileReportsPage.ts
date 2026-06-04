// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import {
  type ListRes,
  type ProjectionCleanFilter,
  type ReconcileExportJob,
  REPORT_TYPE_MAX_LEN,
  buildListPath,
  limitSelectOptions,
  normalizeChainIdParam,
  normalizeIssuesMinParam,
  parseListQuery,
} from "./reconcileReportsPageModel";
import { downloadReconcileReportsExport } from "./reconcileReportsPageExportDownload";
import { useAdminIndexerReconcileReportsPageListFetch } from "./useAdminIndexerReconcileReportsPageListFetch";

export function useAdminIndexerReconcileReportsPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reportTypeInputId = useId();
  const chainIdInputId = useId();
  const projectionCleanSelectId = useId();
  const issuesMinInputId = useId();
  const limitSelectId = useId();
  const datalistId = useId();
  const reconcileReportFilterHintId = useId();
  const reconcileChainFilterHintId = useId();
  const reconcileIssuesMinHintId = useId();
  const reconcileActiveReportTypeDescId = useId();
  const reconcileActiveChainDescId = useId();
  const reconcileActiveCleanDescId = useId();
  const reconcileActiveIssuesMinDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const reconcileReportsExportFilterHintId = useId();
  const adminListApplyResetHintId = useId();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr } = useMemo(
    () => parseListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<ListRes | null>(null);
  const [filterDraft, setFilterDraft] = useState(reportType);
  const [chainFilterDraft, setChainFilterDraft] = useState(chainIdStr);
  const [cleanFilterDraft, setCleanFilterDraft] = useState<ProjectionCleanFilter>(projectionClean);
  const [issuesMinDraft, setIssuesMinDraft] = useState(issuesMinStr);
  const [urlCopied, setUrlCopied] = useState(false);
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ReconcileExportJob>(null);
  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);

  useAdminIndexerReconcileReportsPageListFetch(
    limit,
    offset,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
    setLoading,
    setError,
    setData,
  );

  useEffect(() => {
    setFilterDraft(reportType);
    setChainFilterDraft(chainIdStr);
    setCleanFilterDraft(projectionClean);
    setIssuesMinDraft(issuesMinStr);
  }, [reportType, chainIdStr, projectionClean, issuesMinStr]);

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
    };
  }, []);

  const items = data?.items ?? [];
  const meta = data && isAdminMetaRecord(data.meta) ? data.meta : null;
  const afRaw = data?.applied_filters;
  const appliedFilters =
    afRaw != null && typeof afRaw === "object" && !Array.isArray(afRaw)
      ? (afRaw as Record<string, unknown>)
      : null;
  const total = data?.page?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const rangeFrom = items.length > 0 ? offset + 1 : 0;
  const rangeTo = items.length > 0 ? offset + items.length : 0;
  const limitOptions = useMemo(() => limitSelectOptions(limit), [limit]);

  const listQuery = (nextPage: number, nextLimit: number) =>
    buildListPath({
      page: nextPage,
      limit: nextLimit,
      reportType,
      chainIdStr,
      projectionClean,
      issuesMinStr,
    });

  const hasActiveFilters =
    Boolean(reportType) ||
    Boolean(chainIdStr) ||
    projectionClean === "true" ||
    projectionClean === "false" ||
    Boolean(issuesMinStr);

  const applyFilters = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(
      buildListPath({
        page: 1,
        limit,
        reportType: filterDraft.trim().slice(0, REPORT_TYPE_MAX_LEN),
        chainIdStr: normalizeChainIdParam(chainFilterDraft),
        projectionClean:
          cleanFilterDraft === "true" || cleanFilterDraft === "false" ? cleanFilterDraft : "",
        issuesMinStr: normalizeIssuesMinParam(issuesMinDraft),
      }),
    );
  };

  const resetFilters = () => {
    router.push(
      buildListPath({
        page: 1,
        limit,
        reportType: "",
        chainIdStr: "",
        projectionClean: "",
        issuesMinStr: "",
      }),
    );
  };

  const exportParams = useMemo(
    () => ({
      limit,
      offset,
      reportType,
      chainIdStr,
      projectionClean,
      issuesMinStr,
    }),
    [limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr],
  );

  const runExport = useCallback(
    (format: "csv" | "json", scope: "page" | "all" = "page") =>
      void downloadReconcileReportsExport(
        { format, scope, ...exportParams },
        setExportingFormat,
        setExportError,
      ),
    [exportParams],
  );

  const handleCopyUrl = () => {
    void (async () => {
      if (typeof window === "undefined" || !navigator.clipboard?.writeText) return;
      try {
        await navigator.clipboard.writeText(window.location.href);
        setUrlCopied(true);
        if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
        copyFlashTimer.current = setTimeout(() => setUrlCopied(false), 2000);
      } catch {
        setUrlCopied(false);
      }
    })();
  };

  const onPerPageLimitChange = (next: number) =>
    router.push(
      buildListPath({
        page: 1,
        limit: next,
        reportType,
        chainIdStr,
        projectionClean,
        issuesMinStr,
      }),
    );

  return {
    t,
    pageTitleId,
    reportTypeInputId,
    chainIdInputId,
    projectionCleanSelectId,
    issuesMinInputId,
    limitSelectId,
    datalistId,
    reconcileReportFilterHintId,
    reconcileChainFilterHintId,
    reconcileIssuesMinHintId,
    reconcileActiveReportTypeDescId,
    reconcileActiveChainDescId,
    reconcileActiveCleanDescId,
    reconcileActiveIssuesMinDescId,
    adminAppliedFiltersDescId,
    reconcileReportsExportFilterHintId,
    adminListApplyResetHintId,
    router,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    total,
    page,
    limit,
    offset,
    totalPages,
    rangeFrom,
    rangeTo,
    limitOptions,
    listQuery,
    hasActiveFilters,
    filterDraft,
    setFilterDraft,
    chainFilterDraft,
    setChainFilterDraft,
    cleanFilterDraft,
    setCleanFilterDraft,
    issuesMinDraft,
    setIssuesMinDraft,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
    applyFilters,
    resetFilters,
    exportingFormat,
    exportError,
    urlCopied,
    onExportCsv: () => runExport("csv"),
    onExportJson: () => runExport("json"),
    onExportCsvAll: () => runExport("csv", "all"),
    onExportJsonAll: () => runExport("json", "all"),
    handleCopyUrl,
    onPerPageLimitChange,
  };
}
