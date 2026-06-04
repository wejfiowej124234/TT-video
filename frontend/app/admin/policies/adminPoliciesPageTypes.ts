export type AdminPolicyRow = {
  id?: string;
  policy?: { code?: string; version?: number; status?: string };
  scope?: { type?: string; expr?: string | null };
  binding?: { role?: string; resources?: unknown };
  updated_at?: string;
};

export type AdminPoliciesListRes = {
  status?: string;
  error?: string;
  items?: AdminPolicyRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type AdminPolicyPublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
  meta?: Record<string, unknown>;
};
