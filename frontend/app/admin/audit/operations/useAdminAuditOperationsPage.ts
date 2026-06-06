// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { routes } from "@/lib/api";
import {
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  type AdminAuditOperationsRes,
  buildOpsListPath,
  clampOpsLimit,
  isAuditOpRow,
  parseOpsListQuery,
} from "./adminAuditOperationsPageModel";

type AuditOpRow = { code: string; mutating: boolean };

function auditOpsListToSnapshot(
  body: AdminStandardListBody<AuditOpRow> &
    Pick<AdminAuditOperationsRes, "operations" | "catalog_total" | "returned" | "note">,
): AdminListFetchSnapshot<AuditOpRow> {
  const ops = Array.isArray(body.operations) ? body.operations.filter(isAuditOpRow) : [];
  const baseMeta = isAdminMetaRecord(body.meta) ? body.meta : {};
  const meta: Record<string, unknown> = { ...baseMeta };
  if (typeof body.catalog_total === "number") meta.catalog_total = body.catalog_total;
  if (typeof body.returned === "number") meta.returned = body.returned;
  if (typeof body.note === "string") meta.note = body.note;
  return {
    items: ops,
    appliedFilters: body.applied_filters ?? null,
    meta: Object.keys(meta).length > 0 ? meta : null,
  };
}

export function useAdminAuditOperationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit } = useMemo(
    () => parseOpsListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () => routes.admin.auditOperations({ limit }),
    [limit],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AuditOpRow>({
      scope: "audit-operations",
      context: "AdminAuditOperationsPage",
      listUrl,
      toSnapshot: auditOpsListToSnapshot,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));

  useEffect(() => {
    setDraftLimit(String(limit));
  }, [limit]);

  const body = useMemo((): AdminAuditOperationsRes | null => {
    if (items.length === 0 && !appliedFilters && !meta) return null;
    return {
      operations: items,
      applied_filters: appliedFilters ?? undefined,
      catalog_total: typeof meta?.catalog_total === "number" ? meta.catalog_total : undefined,
      returned: typeof meta?.returned === "number" ? meta.returned : undefined,
      note: typeof meta?.note === "string" ? meta.note : undefined,
      meta,
    };
  }, [items, appliedFilters, meta]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOpsLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(buildOpsListPath({ limit: lim }));
  };

  const reset = () => {
    router.push(buildOpsListPath({ limit: 50 }));
  };

  const operationRows = items;

  return {
    loading,
    refreshing,
    error,
    body,
    meta,
    draftLimit,
    setDraftLimit,
    limit,
    apply,
    reset,
    operationRows,
  };
}
