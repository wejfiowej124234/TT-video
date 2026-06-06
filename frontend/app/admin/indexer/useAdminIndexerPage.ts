import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_INDEXER_HEALTH_META_KEY,
  type IndexerHealthRes,
} from "./indexerPageModel";

function indexerHealthToSnapshot(
  body: AdminStandardListBody<never> & Pick<IndexerHealthRes, "health">,
): AdminListFetchSnapshot<never> {
  const metaBase = isAdminMetaRecord(body.meta) ? body.meta : {};
  return {
    items: [],
    appliedFilters: null,
    meta: {
      ...metaBase,
      [ADMIN_INDEXER_HEALTH_META_KEY]: body.health ?? null,
    },
  };
}

export function useAdminIndexerPage(refreshTick: number) {
  const listUrl = routes.admin.indexerHealth;

  const { meta: rawMeta, loading, refreshing, error } = useAdminStandardListFetch<never>({
    scope: "indexer-health",
    context: "AdminIndexerPage",
    listUrl,
    refreshToken: refreshTick,
    toSnapshot: indexerHealthToSnapshot,
  });

  const health = useMemo((): Record<string, unknown> | null => {
    const raw = rawMeta?.[ADMIN_INDEXER_HEALTH_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    return null;
  }, [rawMeta]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const { [ADMIN_INDEXER_HEALTH_META_KEY]: _drop, ...rest } = rawMeta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [rawMeta]);

  return { loading, refreshing, error, health, meta };
}
