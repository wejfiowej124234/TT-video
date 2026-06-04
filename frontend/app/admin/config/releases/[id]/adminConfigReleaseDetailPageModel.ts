export type AdminConfigReleaseDetailRelease = {
  id?: string;
  release_key?: string;
  version_label?: string;
  status?: string;
  effective_from?: string | null;
  rolled_back_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminConfigReleaseDetailRes = {
  status?: string;
  error?: string;
  release?: AdminConfigReleaseDetailRelease;
  meta?: Record<string, unknown>;
};
