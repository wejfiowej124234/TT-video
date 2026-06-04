export type TenantScopeRow = {
  id?: string;
  tenant_key?: string;
  region_code?: string;
  scope_class?: string;
  status?: string;
  notes?: string | null;
  version?: number;
  updated_at?: string;
};

export type TenantScopesListRes = {
  status?: string;
  error?: string;
  items?: TenantScopeRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type TenantScopePublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: TenantScopeRow;
};
