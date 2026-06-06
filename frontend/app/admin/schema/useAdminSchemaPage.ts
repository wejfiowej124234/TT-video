import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_SCHEMA_ITEMS_MALFORMED_META_KEY,
  ADMIN_SCHEMA_ITEMS_META_KEY,
  SCHEMA_MIGRATIONS_PAGE_LIMIT,
  type SchemaMigrationsRes,
} from "./adminSchemaPageModel";

function schemaListToSnapshot(
  body: AdminStandardListBody<never> & Pick<SchemaMigrationsRes, "items">,
): AdminListFetchSnapshot<never> {
  const raw = body.items;
  const metaBase = isAdminMetaRecord(body.meta) ? body.meta : {};
  const meta: Record<string, unknown> = { ...metaBase };

  if (raw == null) {
    return {
      items: [],
      appliedFilters: body.applied_filters ?? null,
      meta: Object.keys(meta).length > 0 ? meta : null,
    };
  }
  if (Array.isArray(raw) || typeof raw !== "object") {
    if (typeof window !== "undefined") {
      console.error("AdminSchemaPage: items is not a plain object", raw);
    }
    meta[ADMIN_SCHEMA_ITEMS_MALFORMED_META_KEY] = true;
    return {
      items: [],
      appliedFilters: body.applied_filters ?? null,
      meta,
      itemsMalformed: true,
    };
  }
  meta[ADMIN_SCHEMA_ITEMS_META_KEY] = raw;
  return {
    items: [],
    appliedFilters: body.applied_filters ?? null,
    meta,
  };
}

export function useAdminSchemaPage() {
  const listUrl = useMemo(
    () => routes.admin.schemaMigrations({ limit: SCHEMA_MIGRATIONS_PAGE_LIMIT }),
    [],
  );

  const { appliedFilters, meta: rawMeta, loading, refreshing, error, itemsMalformed } =
    useAdminStandardListFetch<never>({
      scope: "schema-migrations",
      context: "AdminSchemaPage",
      listUrl,
      toSnapshot: schemaListToSnapshot,
    });

  const items = useMemo((): Record<string, unknown> | null => {
    const raw = rawMeta?.[ADMIN_SCHEMA_ITEMS_META_KEY];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    if (rawMeta && !(ADMIN_SCHEMA_ITEMS_META_KEY in rawMeta) && !itemsMalformed) {
      return null;
    }
    return null;
  }, [rawMeta, itemsMalformed]);

  const itemsNotPlainObjectError =
    itemsMalformed || Boolean(rawMeta?.[ADMIN_SCHEMA_ITEMS_MALFORMED_META_KEY]);

  const meta = useMemo(() => {
    if (!rawMeta) return null;
    const {
      [ADMIN_SCHEMA_ITEMS_META_KEY]: _items,
      [ADMIN_SCHEMA_ITEMS_MALFORMED_META_KEY]: _malformed,
      ...rest
    } = rawMeta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [rawMeta]);

  return {
    loading,
    refreshing,
    error,
    itemsNotPlainObjectError,
    items,
    meta,
    appliedFilters,
  };
}
