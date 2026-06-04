import { useEffect, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import { SCHEMA_MIGRATIONS_PAGE_LIMIT, type SchemaMigrationsRes } from "./adminSchemaPageModel";

export function useAdminSchemaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [itemsNotPlainObjectError, setItemsNotPlainObjectError] = useState(false);
  const [items, setItems] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItemsNotPlainObjectError(false);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-schema-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    const path = routes.admin.schemaMigrations({ limit: SCHEMA_MIGRATIONS_PAGE_LIMIT });

    adminFetchJson<SchemaMigrationsRes>("AdminSchemaPage", apiUrl(path), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then((json) => {
        const raw = json.items;
        if (raw == null) {
          setItems(null);
          setItemsNotPlainObjectError(false);
        } else if (Array.isArray(raw) || typeof raw !== "object") {
          if (typeof window !== "undefined") {
            console.error("AdminSchemaPage: items is not a plain object", raw);
          }
          setItems(null);
          setItemsNotPlainObjectError(true);
        } else {
          setItems(raw as Record<string, unknown>);
          setItemsNotPlainObjectError(false);
        }
        setMeta(isAdminMetaRecord(json.meta) ? json.meta : null);
        setAppliedFilters(json.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminSchemaPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return {
    loading,
    error,
    itemsNotPlainObjectError,
    items,
    meta,
    appliedFilters,
  };
}
