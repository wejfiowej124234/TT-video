export type MeSessionItem = {
  session_token_suffix?: string;
  is_current?: boolean;
  created_at?: string;
  last_seen_at?: string | null;
  expires_at?: string | null;
  idle_expires_at?: string | null;
  revoked_at?: string | null;
  revoked_reason?: string | null;
};

export type SecurityNotificationItem = {
  id?: string;
  event_type?: string;
  template_key?: string;
  delivery_status?: string;
  payload?: unknown;
  attempts?: number;
  last_error?: string | null;
  created_at?: string;
};
