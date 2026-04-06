/** 从 GET /api/v1/me 响应解析用户角色（链下 mock / 生产一致） */
export function meRoleFromGetMe(me: unknown): string | null {
  if (!me || typeof me !== "object") return null;
  const r = (me as { user?: { role?: string } }).user?.role;
  return typeof r === "string" ? r : null;
}
