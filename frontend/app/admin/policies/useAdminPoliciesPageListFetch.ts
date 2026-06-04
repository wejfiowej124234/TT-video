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
import type { AdminPoliciesListRes, AdminPolicyRow } from "./adminPoliciesPageTypes";

/** `GET …/admin/policies` 列表（**`reloadTick`** 用于发布成功后刷新）。 */
export function useAdminPoliciesPageListFetch(
  limit: number,
  policyCode: string,
  status: string,
  scopeType: string,
  bindingRole: string,
  reloadTick: number,
  setLoading: (v: boolean) => void,
  setError: (v: AdminFetchErrorKind | null) => void,
  setItems: (v: AdminPolicyRow[]) => void,
  setMeta: (v: Record<string, unknown> | null) => void,
  setAppliedFilters: (v: Record<string, unknown> | null) => void,
) {
  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-policies-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminPoliciesListRes>(
      "AdminPoliciesPage",
      apiUrl(
        routes.admin.policies({
          limit,
          ...(policyCode ? { policy_code: policyCode } : {}),
          ...(status === "draft" || status === "active" || status === "deprecated"
            ? { status }
            : {}),
          ...(scopeType ? { scope_type: scopeType } : {}),
          ...(bindingRole ? { binding_role: bindingRole } : {}),
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
        logAdminFetch("AdminPoliciesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [
    limit,
    policyCode,
    status,
    scopeType,
    bindingRole,
    reloadTick,
    setLoading,
    setError,
    setItems,
    setMeta,
    setAppliedFilters,
  ]);
}
