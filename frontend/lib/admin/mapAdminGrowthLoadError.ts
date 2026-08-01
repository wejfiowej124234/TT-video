/** B9-U5 · map growth API machine errors to ops i18n keys (honest empty · HU-146/147). */
export function mapAdminGrowthLoadError(e: unknown, fallbackKey: string): string {
  const msg = e instanceof Error ? e.message : "";
  if (
    msg === "growth_db_unavailable" ||
    msg === "database_required" ||
    msg === "chain_off_unavailable"
  ) {
    return "admin_growth_db_unavailable";
  }
  if (msg === "forbidden" || msg === "internal_api_forbidden" || /forbidden/i.test(msg)) {
    return "admin_growth_forbidden";
  }
  return fallbackKey;
}
