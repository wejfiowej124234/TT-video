import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import { ADMIN_OBS_OVERVIEW_META_KEY, type OverviewBody } from "./observabilityPageModel";

function obsOverviewToSnapshot(body: AdminStandardListBody<never> & OverviewBody): AdminListFetchSnapshot<never> {
  const metaBase = isAdminMetaRecord(body.meta) ? body.meta : {};
  return {
    items: [],
    appliedFilters: null,
    meta: {
      ...metaBase,
      [ADMIN_OBS_OVERVIEW_META_KEY]: body,
    },
  };
}

export function useAdminObservabilityPage() {
  const listUrl = routes.admin.observabilityOverview;

  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({
    scope: "observability-overview",
    context: "AdminObservabilityPage",
    listUrl,
    toSnapshot: obsOverviewToSnapshot,
  });

  const body = useMemo((): OverviewBody | null => {
    const raw = rawMeta?.[ADMIN_OBS_OVERVIEW_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as OverviewBody;
    }
    return null;
  }, [rawMeta]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const { [ADMIN_OBS_OVERVIEW_META_KEY]: _drop, ...rest } = rawMeta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [rawMeta]);

  return { loading, refreshing, error, body, meta };
}
