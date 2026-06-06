export type SchemaMigrationsRes = {
  status?: string;
  error?: string;
  applied_filters?: Record<string, unknown>;
  items?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const SCHEMA_MIGRATIONS_PAGE_LIMIT = 100;

/** Stashed in list-fetch meta when API `items` is a plain object map (not an array). */
export const ADMIN_SCHEMA_ITEMS_META_KEY = "__adminSchemaItems";
export const ADMIN_SCHEMA_ITEMS_MALFORMED_META_KEY = "__adminSchemaItemsMalformed";
