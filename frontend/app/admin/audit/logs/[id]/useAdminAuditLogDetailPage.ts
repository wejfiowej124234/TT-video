import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import type { AdminAuditLogDetailRes } from "./adminAuditLogDetailPageModel";

export function useAdminAuditLogDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const logId = decodeURIComponent(rawId.trim());

  const detailUrl = useMemo(() => (logId ? routes.admin.auditLogById(logId) : ""), [logId]);

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminAuditLogDetailRes>({
    scope: "audit-log-detail",
    context: "AdminAuditLogDetailPage",
    detailUrl,
    resourceId: logId,
  });

  const row = body?.audit_log && typeof body.audit_log === "object" ? body.audit_log : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { logId, loading, refreshing, error, body, row, meta };
}
