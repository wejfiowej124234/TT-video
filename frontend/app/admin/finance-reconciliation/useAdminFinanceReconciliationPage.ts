"use client";



import { useEffect, useMemo, useState } from "react";



import { useTranslation } from "@/components/LocaleProvider";

import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";

import {

  loadAdminFinanceReconciliationBundle,

  readAdminFinanceReconciliationBundleWarm,

} from "@/lib/admin/adminFinanceReconciliationBundleFetch";

import type { NormalizedAdminCrossCheck, NormalizedAdminDriftSummary } from "@/lib/apiClient";

import { deriveChainAlignmentStatus, summarizeDeltaForHub } from "@/lib/financeReconciliationDriftStrip";

import {

  FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,

  FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS,

  FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS,

} from "@/lib/financeReconciliationHubPaths";

import { ADMIN_CROSS_CHECK_MODEL_META_KEY } from "../cross-check/adminCrossCheckPageModel";

import { ADMIN_DRIFT_SUMMARY_MODEL_META_KEY } from "../drift-summary/adminDriftSummaryPageModel";



import {

  ADMIN_FINANCE_RECON_BODY_META_KEY,

  type FinanceRes,

  isRecord,

  pathRows,

} from "./adminFinanceReconciliationPageModel";



export type AdminFinanceReconciliationPageViewModel = {

  na: string;

  loading: boolean;

  refreshing: boolean;

  error: AdminFetchErrorKind | null;

  metaRows: { path: string; text: string }[];

  summaryRows: { path: string; text: string }[];

  lastRows: { path: string; text: string }[];

  hasReportId: boolean;

  reportIdRaw: string;

  driftStripLoading: boolean;

  driftStripRefreshing: boolean;

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



  const warm = readAdminFinanceReconciliationBundleWarm();

  const [summaryMeta, setSummaryMeta] = useState<Record<string, unknown> | null>(warm?.summary.meta ?? null);

  const [crossMeta, setCrossMeta] = useState<Record<string, unknown> | null>(warm?.cross.meta ?? null);

  const [driftMeta, setDriftMeta] = useState<Record<string, unknown> | null>(warm?.drift.meta ?? null);

  const [loading, setLoading] = useState(warm == null);

  const [refreshing, setRefreshing] = useState(warm != null);

  const [error, setError] = useState<AdminFetchErrorKind | null>(null);

  const [crossErr, setCrossErr] = useState<AdminFetchErrorKind | null>(null);

  const [driftSummaryErr, setDriftSummaryErr] = useState<AdminFetchErrorKind | null>(null);



  useEffect(() => {

    const initialWarm = readAdminFinanceReconciliationBundleWarm();

    if (initialWarm) {

      setSummaryMeta(initialWarm.summary.meta);

      setCrossMeta(initialWarm.cross.meta);

      setDriftMeta(initialWarm.drift.meta);

      setLoading(false);

      setRefreshing(true);

    } else {

      setLoading(true);

      setRefreshing(false);

    }

    setError(null);

    setCrossErr(null);

    setDriftSummaryErr(null);



    return loadAdminFinanceReconciliationBundle(

      (snapshots) => {

        setSummaryMeta(snapshots.summary.meta);

        setCrossMeta(snapshots.cross.meta);

        setDriftMeta(snapshots.drift.meta);

        setError(null);

        setCrossErr(null);

        setDriftSummaryErr(null);

      },

      (errors) => {

        if (errors.summary) setError(errors.summary);

        if (errors.cross) setCrossErr(errors.cross);

        if (errors.drift) setDriftSummaryErr(errors.drift);

      },

      () => {

        setLoading(false);

        setRefreshing(false);

      },

    );

  }, []);



  const body = useMemo((): FinanceRes | null => {

    const raw = summaryMeta?.[ADMIN_FINANCE_RECON_BODY_META_KEY];

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {

      return raw as FinanceRes;

    }

    return null;

  }, [summaryMeta]);



  const crossNorm = useMemo((): NormalizedAdminCrossCheck | null => {

    const raw = crossMeta?.[ADMIN_CROSS_CHECK_MODEL_META_KEY];

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {

      return raw as NormalizedAdminCrossCheck;

    }

    return null;

  }, [crossMeta]);



  const driftNorm = useMemo((): NormalizedAdminDriftSummary | null => {

    const raw = driftMeta?.[ADMIN_DRIFT_SUMMARY_MODEL_META_KEY];

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {

      return raw as NormalizedAdminDriftSummary;

    }

    return null;

  }, [driftMeta]);



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



  const driftStripLoading = loading && (crossNorm == null || driftNorm == null);



  return {

    na,

    loading,

    refreshing,

    error,

    metaRows,

    summaryRows,

    lastRows,

    hasReportId,

    reportIdRaw,

    driftStripLoading,

    driftStripRefreshing: refreshing,

    crossErr,

    driftSummaryErr,

    crossNorm,

    driftNorm,

    hubAlignment,

    driftSummaryDeltaLine,

    crossDriftDeltaLine,

  };

}


