import {

  adminFetchErrorKind,

  adminFetchJson,

  logAdminFetch,

  type AdminFetchErrorKind,

} from "@/lib/adminFetchDisplay";

import { apiUrl, routes } from "@/lib/api";

import { getAuthHeaders } from "@/lib/apiClient";

import {

  adminListFetchCacheKey,

  dedupeAdminListFetch,

  readAdminListFetchCache,

  writeAdminListFetchCache,

  type AdminListFetchSnapshot,

} from "@/lib/admin/adminListFetchCache";

import {

  normalizeAdminCrossCheckRead,

  normalizeAdminDriftSummaryRead,

} from "@/lib/apiClient";

import { ADMIN_CROSS_CHECK_MODEL_META_KEY } from "@/app/admin/cross-check/adminCrossCheckPageModel";

import { ADMIN_DRIFT_SUMMARY_MODEL_META_KEY } from "@/app/admin/drift-summary/adminDriftSummaryPageModel";

import {

  ADMIN_FINANCE_RECON_BODY_META_KEY,

  type FinanceRes,

} from "@/app/admin/finance-reconciliation/adminFinanceReconciliationPageModel";

import type { AdminStandardListBody } from "@/lib/admin/useAdminStandardListFetch";



export const ADMIN_FINANCE_RECON_BUNDLE_SCOPE = "finance-reconciliation-bundle";



export type AdminFinanceReconciliationBundleSnapshots = {

  summary: AdminListFetchSnapshot<never>;

  cross: AdminListFetchSnapshot<never>;

  drift: AdminListFetchSnapshot<never>;

};



export type AdminFinanceReconciliationBundleErrors = {

  summary: AdminFetchErrorKind | null;

  cross: AdminFetchErrorKind | null;

  drift: AdminFetchErrorKind | null;

};



function summarySnapshot(body: AdminStandardListBody<never> & FinanceRes): AdminListFetchSnapshot<never> {

  return {

    items: [],

    appliedFilters: null,

    meta: { [ADMIN_FINANCE_RECON_BODY_META_KEY]: body },

  };

}



function crossSnapshot(body: AdminStandardListBody<never>): AdminListFetchSnapshot<never> {

  return {

    items: [],

    appliedFilters: null,

    meta: { [ADMIN_CROSS_CHECK_MODEL_META_KEY]: normalizeAdminCrossCheckRead(body) },

  };

}



function driftSnapshot(body: AdminStandardListBody<never>): AdminListFetchSnapshot<never> {

  return {

    items: [],

    appliedFilters: null,

    meta: { [ADMIN_DRIFT_SUMMARY_MODEL_META_KEY]: normalizeAdminDriftSummaryRead(body) },

  };

}



export function adminFinanceReconciliationCacheKeys() {

  return {

    summary: adminListFetchCacheKey("finance-reconciliation-summary", routes.admin.financeSummary),

    cross: adminListFetchCacheKey("finance-reconciliation-cross-check", routes.admin.crossCheck),

    drift: adminListFetchCacheKey("finance-reconciliation-drift-summary", routes.admin.driftSummary),

    bundle: adminListFetchCacheKey(ADMIN_FINANCE_RECON_BUNDLE_SCOPE, "parallel-v1"),

  };

}



export function readAdminFinanceReconciliationBundleWarm(): AdminFinanceReconciliationBundleSnapshots | null {

  const keys = adminFinanceReconciliationCacheKeys();

  const summary = readAdminListFetchCache<AdminListFetchSnapshot<never>>(keys.summary);

  const cross = readAdminListFetchCache<AdminListFetchSnapshot<never>>(keys.cross);

  const drift = readAdminListFetchCache<AdminListFetchSnapshot<never>>(keys.drift);

  if (!summary || !cross || !drift) return null;

  return { summary, cross, drift };

}



async function fetchSnapshot<TBody extends AdminStandardListBody<never>>(

  context: string,

  listUrl: string,

  toSnapshot: (body: TBody) => AdminListFetchSnapshot<never>,

): Promise<AdminListFetchSnapshot<never>> {

  const headers: Record<string, string> = {

    "x-request-id": `${context}-${Date.now()}`,

  };

  Object.assign(headers, getAuthHeaders());

  const { res, body } = await adminFetchJson<TBody>(context, apiUrl(listUrl), { headers });

  if (!res.ok) {

    throw new Error(body.error || `request_failed_${res.status}`);

  }

  return toSnapshot(body);

}



/** 三 API 并行 bootstrap · 写入各 scope SWR 缓存。 */

export async function fetchAdminFinanceReconciliationBundle(): Promise<AdminFinanceReconciliationBundleSnapshots> {

  const keys = adminFinanceReconciliationCacheKeys();

  const [summary, cross, drift] = await Promise.all([

    fetchSnapshot("AdminFinanceReconciliationPage", routes.admin.financeSummary, summarySnapshot),

    fetchSnapshot("AdminFinanceReconciliationCrossCheck", routes.admin.crossCheck, crossSnapshot),

    fetchSnapshot("AdminFinanceReconciliationDriftSummary", routes.admin.driftSummary, driftSnapshot),

  ]);

  writeAdminListFetchCache(keys.summary, summary);

  writeAdminListFetchCache(keys.cross, cross);

  writeAdminListFetchCache(keys.drift, drift);

  return { summary, cross, drift };

}



export function loadAdminFinanceReconciliationBundle(

  onSuccess: (snapshots: AdminFinanceReconciliationBundleSnapshots) => void,

  onError: (errors: AdminFinanceReconciliationBundleErrors) => void,

  onFinally: () => void,

): () => void {

  let cancelled = false;

  const keys = adminFinanceReconciliationCacheKeys();

  const warm = readAdminFinanceReconciliationBundleWarm();



  void dedupeAdminListFetch(keys.bundle, () => fetchAdminFinanceReconciliationBundle())

    .then((snapshots) => {

      if (cancelled) return;

      onSuccess(snapshots);

    })

    .catch((e: unknown) => {

      if (cancelled) return;

      logAdminFetch("AdminFinanceReconciliationBundle", e);

      const kind = adminFetchErrorKind(e);

      onError({

        summary: warm?.summary ? null : kind,

        cross: warm?.cross ? null : kind,

        drift: warm?.drift ? null : kind,

      });

    })

    .finally(() => {

      if (!cancelled) onFinally();

    });



  return () => {

    cancelled = true;

  };

}


