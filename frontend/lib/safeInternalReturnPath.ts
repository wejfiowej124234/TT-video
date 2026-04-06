/**
 * 登录/注册成功后跳转：仅允许站内相对路径，拒绝 open redirect（`//host`、`scheme://` 等）。
 */
export function safeInternalReturnPath(raw: string | null | undefined, fallback: string): string {
  if (raw == null || !String(raw).trim()) return fallback;
  let p = String(raw).trim();
  if (p.includes("\\")) return fallback;
  p = p.startsWith("/") ? p : `/${p}`;
  if (p.startsWith("//") || p.includes("://")) return fallback;
  return p;
}
