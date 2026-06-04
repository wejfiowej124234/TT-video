export type AdminAuditLog = {
  id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  actor_id?: string;
  request_id?: string;
  payload?: unknown;
  created_at?: string;
};

export type AdminAuditLogsRes = {
  status?: string;
  items?: AdminAuditLog[];
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
  error?: string;
};
