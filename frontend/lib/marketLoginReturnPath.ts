/**
 * B-060：`/market` 等页上抽屉内动作触发 `login_required` 时，`returnUrl` 须保留当前 **pathname + query**，
 * 登录返回后列表/筛选与深链语义一致。
 */
export function buildLoginReturnPathWithQuery(
  pathname: string | null | undefined,
  searchString: string,
  fallbackBase: string
): string {
  const fb = fallbackBase.trim() || "/market";
  const base =
    pathname && pathname !== "/" && pathname.trim() !== "" ? pathname.trim() : fb;
  const raw = String(searchString ?? "").trim();
  const q = raw.startsWith("?") ? raw.slice(1) : raw;
  return q ? `${base}?${q}` : base;
}
