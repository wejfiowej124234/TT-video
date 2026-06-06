import { useMemo } from "react";

import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";
import { normalizeAdminCrossCheckRead, type NormalizedAdminCrossCheck } from "@/lib/apiClient";

import { ADMIN_CROSS_CHECK_MODEL_META_KEY } from "./adminCrossCheckPageModel";

function crossCheckToSnapshot(body: AdminStandardListBody<never>): AdminListFetchSnapshot<never> {
  return {
    items: [],
    appliedFilters: null,
    meta: {
      [ADMIN_CROSS_CHECK_MODEL_META_KEY]: normalizeAdminCrossCheckRead(body),
    },
  };
}

export function useAdminCrossCheckPage() {
  const listUrl = routes.admin.crossCheck;

  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({
    scope: "cross-check",
    context: "AdminCrossCheckPage",
    listUrl,
    toSnapshot: crossCheckToSnapshot,
  });

  const model = useMemo((): NormalizedAdminCrossCheck | null => {
    const raw = rawMeta?.[ADMIN_CROSS_CHECK_MODEL_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as NormalizedAdminCrossCheck;
    }
    return null;
  }, [rawMeta]);

  return { loading, refreshing, error, model };
}
