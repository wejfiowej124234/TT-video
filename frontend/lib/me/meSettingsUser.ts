import type { UserShape } from "@/components/me/constants";

/** `GET /me` 用户是否已完成邮箱验证 */
export function isMeEmailVerified(user: UserShape | null | undefined): boolean {
  if (!user) return true;
  const top = user.email_verified_at as string | null | undefined;
  if (top) return true;
  const nested = (user as { user?: { email_verified_at?: string | null } }).user?.email_verified_at;
  return Boolean(nested);
}

export function shouldShowStewardRegister(user: UserShape | null | undefined): boolean {
  if (!user) return false;
  const role = (user.role ?? user.role_traveltrust ?? "").toString().toLowerCase();
  return role !== "region_steward" && role !== "steward";
}
