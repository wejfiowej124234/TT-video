import type { UserShape } from "@/components/me/constants";

/** True if legacy `role` or 87 `role_traveltrust` marks user as guide (hide「注册向导」类 CTA). */
export function userIsGuide(user: Pick<UserShape, "role" | "role_traveltrust"> | null | undefined): boolean {
  if (user?.role === "guide") return true;
  const rt = typeof user?.role_traveltrust === "string" ? user.role_traveltrust.trim() : "";
  return rt === "guide";
}

/** Prefer 87 protocol copy (`role_traveltrust`); fall back to legacy `role`. */
export function meProtocolRoleForDisplay(user: UserShape | null | undefined): string {
  const rt = typeof user?.role_traveltrust === "string" ? user.role_traveltrust.trim() : "";
  if (rt !== "") return rt;
  const r = typeof user?.role === "string" ? user.role.trim() : "";
  return r;
}

/** i18n key for profile role pill (display only). Guide CTA branching uses `userIsGuide`. */
export function meRoleLabelI18nKey(protocolRole: string): string {
  switch (protocolRole) {
    case "guide":
      return "me_role_guide";
    case "arbitrator":
      return "me_role_arbitrator";
    case "admin":
    case "super_admin":
      return "me_role_admin";
    case "traveler":
      return "me_role_traveler";
    case "tourist":
      return "me_role_tourist";
    default:
      return "me_role_tourist";
  }
}

/** API `author.role` / `users.role` 存值 → 社区角色文案 key（699+700：`traveler`/扩展角色与 87、04 §二 2.1 对齐）。 */
export function communityStoredRoleLabelI18nKey(role: string | null | undefined): string {
  const r = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (r === "guide") return "community_role_guide";
  if (r === "traveler") return "community_role_traveler";
  if (r === "tourist") return "community_role_tourist";
  if (r === "arbitrator") return "community_role_arbitrator";
  if (r === "admin" || r === "super_admin") return "community_role_admin";
  if (r === "provider") return "community_role_provider";
  if (r === "region_steward") return "community_role_region_steward";
  return "community_role_tourist";
}

/** Community shell `/community/me` header line (display only). */
export function communityRoleLabelI18nKey(protocolRole: string): string {
  switch (protocolRole) {
    case "guide":
      return "community_role_guide";
    case "arbitrator":
      return "community_role_arbitrator";
    case "admin":
    case "super_admin":
      return "community_role_admin";
    case "traveler":
      return "community_role_traveler";
    case "tourist":
      return "community_role_tourist";
    default:
      return "community_role_tourist";
  }
}
