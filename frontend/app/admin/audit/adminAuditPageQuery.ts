import { clampAdminAuditLimit } from "@/lib/adminAuditLogsPath";

export type AdminAuditListQuery = {
  limit: number;
  actor_id: string;
  action: string;
  resource_type: string;
};

export function parseAuditListQuery(sp: URLSearchParams): AdminAuditListQuery {
  const limit = clampAdminAuditLimit(Number.parseInt(sp.get("limit") ?? "50", 10));
  return {
    limit,
    actor_id: (sp.get("actor_id") ?? "").trim(),
    action: (sp.get("action") ?? "").trim(),
    resource_type: (sp.get("resource_type") ?? "").trim(),
  };
}
