import { useMemo } from "react";

import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";
import { normalizeAdminDriftSummaryRead, type NormalizedAdminDriftSummary } from "@/lib/apiClient";

import { ADMIN_DRIFT_SUMMARY_MODEL_META_KEY } from "./adminDriftSummaryPageModel";

function driftSummaryToSnapshot(body: AdminStandardListBody<never>): AdminListFetchSnapshot<never> {
  return {
    items: [],
    appliedFilters: null,
    meta: {
      [ADMIN_DRIFT_SUMMARY_MODEL_META_KEY]: normalizeAdminDriftSummaryRead(body),
    },
  };
}

export function useAdminDriftSummaryPage() {
  const listUrl = routes.admin.driftSummary;

  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({
    scope: "drift-summary",
    context: "AdminDriftSummaryPage",
    listUrl,
    toSnapshot: driftSummaryToSnapshot,
  });

  const model = useMemo((): NormalizedAdminDriftSummary | null => {
    const raw = rawMeta?.[ADMIN_DRIFT_SUMMARY_MODEL_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as NormalizedAdminDriftSummary;
    }
    return null;
  }, [rawMeta]);

  return { loading, refreshing, error, model };
}
