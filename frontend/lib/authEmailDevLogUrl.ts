/** 从 **`_dev_log_url`**（E2E/log 运输）解析 query **`token`**。 */
export function parseAuthEmailTokenFromDevLogUrl(devLogUrl: unknown): string | null {
  if (typeof devLogUrl !== "string" || !devLogUrl.trim()) return null;
  try {
    const u = new URL(devLogUrl);
    return u.searchParams.get("token");
  } catch {
    return null;
  }
}
