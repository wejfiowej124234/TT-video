export type AdminFlagRow = {
  id?: string;
  flag_code?: string;
  description?: string | null;
  scope?: string | null;
  enabled?: boolean;
  rollout_percent?: number | null;
  region?: unknown;
  version?: number;
  updated_at?: string;
};

export type AdminFlagsListRes = {
  status?: string;
  error?: string;
  items?: AdminFlagRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type AdminFlagPublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
};

export type AdminFlagRegionMode = "unchanged" | "clear" | "set";
