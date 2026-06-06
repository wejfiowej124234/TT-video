// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { routes } from "@/lib/api";
import {
  defaultAdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_RECONCILE_PAGE_META_KEY,
  type ListRes,
  type ProjectionCleanFilter,
  type ReconcileExportJob,
  type ReconcileReportRow,
  REPORT_TYPE_MAX_LEN,
  buildListPath,
  limitSelectOptions,
  normalizeChainIdParam,
  normalizeIssuesMinParam,
  parseListQuery,
} from "./reconcileReportsPageModel";
import { downloadReconcileReportsExport } from "./reconcileReportsPageExportDownload";

function reconcileListToSnapshot(
  body: AdminStandardListBody<ReconcileReportRow> & Pick<ListRes, "page">,
) {
  const base = defaultAdminListFetchSnapshot(body);
  if (body.page && typeof body.page === "object") {
    return {
      ...base,
      meta: {
        ...(base.meta ?? {}),
        [ADMIN_RECONCILE_PAGE_META_KEY]: body.page,
      },
    };
  }
  return base;
}

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

  const listUrl = useMemo(
    () =>
      routes.admin.indexerReconcileReports({
        limit,
        offset,
        ...(reportType ? { report_type: reportType } : {}),
        ...(chainIdStr ? { chain_id: chainIdStr } : {}),
        ...(projectionClean === "true" || projectionClean === "false"
          ? { projection_reconcile_clean: projectionClean === "true" }
          : {}),
        ...(issuesMinStr ? { issues_min: Number.parseInt(issuesMinStr, 10) } : {}),
      }),
    [limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr],
  );

  const { items, appliedFilters, meta: rawMeta, loading, refreshing, error } =
    useAdminStandardListFetch<ReconcileReportRow>({
      scope: "indexer-reconcile-reports",
      context: "AdminIndexerReconcileReportsPage",
      listUrl,
      toSnapshot: reconcileListToSnapshot,
    });

  const [filterDraft, setFilterDraft] = useState(reportType);
  const [chainFilterDraft, setChainFilterDraft] = useState(chainIdStr);
  const [cleanFilterDraft, setCleanFilterDraft] = useState<ProjectionCleanFilter>(projectionClean);
  const [issuesMinDraft, setIssuesMinDraft] = useState(issuesMinStr);
  const [urlCopied, setUrlCopied] = useState(false);
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ReconcileExportJob>(null);
  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);

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

  const pageInfo = useMemo(() => {
    const raw = rawMeta?.[ADMIN_RECONCILE_PAGE_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as NonNullable<ListRes["page"]>;
    }
    return undefined;
  }, [rawMeta]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const { [ADMIN_RECONCILE_PAGE_META_KEY]: _drop, ...rest } = rawMeta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [rawMeta]);

  const total = pageInfo?.total ?? 0;
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
    refreshing,
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
