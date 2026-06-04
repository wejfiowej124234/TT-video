"use client";

import { useEffect } from "react";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import type { TenantScopesListRes, TenantScopeRow } from "./adminTenantScopesPageTypes";

/** `GET …/admin/tenants/scopes` 列表（**`reloadTick`** 用于发布成功后刷新）。 */
export function useAdminTenantScopesPageListFetch(
  limit: number,
  tenantKey: string,
  regionCode: string,
  status: string,
  scopeClass: string,
  reloadTick: number,
  setLoading: (v: boolean) => void,
  setError: (v: AdminFetchErrorKind | null) => void,
  setItems: (v: TenantScopeRow[]) => void,
  setMeta: (v: Record<string, unknown> | null) => void,
  setAppliedFilters: (v: Record<string, unknown> | null) => void,
) {
  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-tenant-scopes-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<TenantScopesListRes>(
      "AdminTenantScopesPage",
      apiUrl(
        routes.admin.tenantScopes({
          limit,
          ...(tenantKey ? { tenant_key: tenantKey } : {}),
          ...(regionCode ? { region_code: regionCode } : {}),
          ...(status ? { status } : {}),
          ...(scopeClass ? { scope_class: scopeClass } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminTenantScopesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [
    limit,
    tenantKey,
    regionCode,
    status,
    scopeClass,
    reloadTick,
    setLoading,
    setError,
    setItems,
    setMeta,
    setAppliedFilters,
  ]);
}
