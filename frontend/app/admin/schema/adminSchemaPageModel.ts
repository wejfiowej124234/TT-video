export type SchemaMigrationsRes = {
  status?: string;
  error?: string;
  applied_filters?: Record<string, unknown>;
  items?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const SCHEMA_MIGRATIONS_PAGE_LIMIT = 100;
