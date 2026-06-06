export type AuthAuditEventItem = {
  id?: string;
  event_type?: string;
  user_id?: string | null;
  request_id?: string | null;
  client_ip?: string | null;
  user_agent?: string | null;
  reason?: string | null;
  payload?: unknown;
  created_at?: string;
};

export type GetAdminAuthAuditEventsParams = {
  limit?: number;
  event_type?: string;
  reason?: string;
  user_id?: string;
  client_ip?: string;
};

export type AdminAuthAuditEventsResponse = {
  status: string;
  items?: AuthAuditEventItem[];
  applied_filters?: {
    event_type?: string | null;
    reason?: string | null;
    user_id?: string | null;
    client_ip?: string | null;
    limit?: number;
  };
};
