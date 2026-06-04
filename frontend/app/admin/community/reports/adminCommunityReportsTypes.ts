export type ReportRow = {
  id?: string;
  reporter_id?: string;
  target_type?: string;
  target_id?: string;
  reason_code?: string;
  details?: string | null;
  status?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

export type ReportsRes = {
  status?: string;
  error?: string;
  items?: ReportRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type ModerationRes = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: { penalty_id?: string; version?: number };
};

export const STATUS_OPTIONS = ["", "open", "in_review", "resolved", "dismissed"] as const;
export const STATUS_URL = new Set(["open", "in_review", "resolved", "dismissed"]);
export const TT_MAX = 64;
export const RC_MAX = 128;
export const MOD_STATUS_OPTIONS = ["open", "in_review", "resolved", "dismissed"] as const;
export const PENALTY_ACTIONS = [
  "warn",
  "limit_feed",
  "mute",
  "ban",
  "shadow_ban",
  "content_remove",
  "other",
] as const;

export type ReportsListParsed = {
  limit: number;
  status: string;
  reporterId: string;
  targetType: string;
  reasonCode: string;
  targetId: string;
};
