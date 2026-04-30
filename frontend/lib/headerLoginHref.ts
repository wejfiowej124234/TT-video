import { safeInternalReturnPath } from "@/lib/safeInternalReturnPath";
import { buildLoginReturnPathWithQuery } from "@/lib/marketLoginReturnPath";

/**
 * 从 `/auth/forgot-password` 等辅助页回到登录时的显式回流（与顶栏 `returnUrl` 契约一致；默认首页）。
 */
export const AUTH_LOGIN_RETURN_HOME = `/auth/login?returnUrl=${encodeURIComponent("/")}` as const;

/** `/auth/error` 等处的「去注册」：与登录同源显式 `returnUrl=/`。 */
export const AUTH_REGISTER_RETURN_HOME = `/auth/register?returnUrl=${encodeURIComponent("/")}` as const;

/** 顶栏用：pathname + `URLSearchParams` 串 → 经 B-060 拼接器 + `safeInternalReturnPath`（与 `buildLoginReturnPathWithQuery` 同源）。 */
function buildHeaderReturnUrlCandidate(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined,
): string {
  const raw = (pathname ?? "").trim();
  const q = (searchParams?.toString() ?? "").trim();
  return safeInternalReturnPath(buildLoginReturnPathWithQuery(raw || null, q, "/"), "/");
}

/**
 * 顶栏「登录」链接：在 `/auth/*` 不自指；其余路径带 `returnUrl`（pathname + query），经 `safeInternalReturnPath` 校验。
 */
export function buildHeaderLoginHref(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined,
): string {
  const authBase = (pathname ?? "").trim();
  if (authBase.startsWith("/auth")) return "/auth/login";
  const returnPath = buildHeaderReturnUrlCandidate(pathname, searchParams);
  return `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`;
}

/**
 * 顶栏「注册」链接：在 `/auth/*` 不带 `returnUrl`（避免自嵌套）；其余路径带 `returnUrl` 供注册成功后 `router.replace`。
 */
export function buildHeaderRegisterHref(
  pathname: string | null | undefined,
  searchParams: { toString(): string } | null | undefined,
): string {
  const authBase = (pathname ?? "").trim();
  if (authBase.startsWith("/auth")) return "/auth/register";
  const returnPath = buildHeaderReturnUrlCandidate(pathname, searchParams);
  return `/auth/register?returnUrl=${encodeURIComponent(returnPath)}`;
}

/**
 * 已登录用户菜单「注册商家 / 区域主理人」：`role` + 当前 **pathname + query** 作为 `returnUrl`（B-060，与顶栏登录链一致）；在 `/auth/*` 不传 `returnUrl`。
 */
export function buildAuthRegisterRoleHref(
  pathname: string | null | undefined,
  role: "provider" | "steward",
  searchParams?: { toString(): string } | null | undefined,
): string {
  const authBase = (pathname ?? "").trim();
  if (authBase.startsWith("/auth")) {
    return `/auth/register?${new URLSearchParams({ role }).toString()}`;
  }
  const returnPath = buildHeaderReturnUrlCandidate(pathname, searchParams);
  return `/auth/register?${new URLSearchParams({ role, returnUrl: returnPath }).toString()}`;
}
