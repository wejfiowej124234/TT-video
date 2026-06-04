export type AdminModerationCaseRow = {
  id?: string;
  report_id?: string;
  actor_id?: string;
  status_before?: string;
  status_after?: string;
  admin_notes_snapshot?: string | null;
  disposition_snapshot?: string | null;
  penalty_id?: string | null;
  created_at?: string;
};

export type AdminModerationCasesRes = {
  status?: string;
  error?: string;
  items?: AdminModerationCaseRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};
