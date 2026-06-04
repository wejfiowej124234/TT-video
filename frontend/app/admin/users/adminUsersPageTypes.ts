export type AdminUser = {
  id: string;
  email: string;
  role: string;
  kyc_status?: string;
  created_at?: string;
  acquisition_publish_suspended?: boolean;
  acquisition_publish_suspended_until?: string | null;
};

export type AdminUsersRes = {
  status?: string;
  items?: AdminUser[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

export type RoleChangeRes = {
  status?: string;
  error?: string;
  approval_request_id?: string;
};
