export type AdminCommunityPenaltyRow = {
  id?: string;
  report_id?: string | null;
  subject_user_id?: string;
  action?: string;
  status?: string;
  reason?: string | null;
  created_by?: string;
  expires_at?: string | null;
  metadata?: unknown;
  created_at?: string;
};

export type AdminCommunityPenaltiesListRes = {
  status?: string;
  error?: string;
  items?: AdminCommunityPenaltyRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type AdminCommunityPenaltyCreateRes = { status?: string; error?: string; id?: string };
