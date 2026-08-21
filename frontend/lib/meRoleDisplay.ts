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

/**
 * Comment / feed identity rank (highest first):
 * 管理员 > 区域主理人 > 商家 > 向导 > 旅行者/游客.
 * Multiple identities → only the first (highest) pill.
 */
export const COMMUNITY_AUTHOR_IDENTITY_PRIORITY = [
  "community_role_admin",
  "community_role_region_steward",
  "community_role_provider",
  "community_role_guide",
  "community_role_arbitrator",
  "community_role_traveler",
  "community_role_tourist",
] as const;

function communityAuthorIdentityKeySet(author: {
  role?: string | null;
  isEscrowGuide?: boolean;
} | null | undefined): Set<string> {
  const r = typeof author?.role === "string" ? author.role.trim().toLowerCase() : "";
  const keys = new Set<string>();
  if (r === "admin" || r === "super_admin") keys.add("community_role_admin");
  if (r === "region_steward") keys.add("community_role_region_steward");
  if (r === "provider") keys.add("community_role_provider");
  if (r === "guide" || Boolean(author?.isEscrowGuide)) keys.add("community_role_guide");
  if (r === "arbitrator") keys.add("community_role_arbitrator");
  if (r === "traveler") keys.add("community_role_traveler");
  if (r === "tourist") keys.add("community_role_tourist");
  return keys;
}

function communityAuthorPrimaryIdentityFromKeys(keys: Set<string>): string {
  for (const k of COMMUNITY_AUTHOR_IDENTITY_PRIORITY) {
    if (keys.has(k)) return k;
  }
  return "community_role_tourist";
}

/**
 * Post / feed / comment identity pill under display name.
 * One pill only — never 托管向导 / 预约向导, never stacked 管理员+向导.
 */
export function communityAuthorIdentityI18nKeys(author: {
  role?: string | null;
  isEscrowGuide?: boolean;
} | null | undefined): string[] {
  return [communityAuthorPrimaryIdentityFromKeys(communityAuthorIdentityKeySet(author))];
}

/** Same person on post + comment: keep the higher-ranked identity (comment API may omit admin). */
export function communityAuthorIdentityForComment(
  commentAuthor: {
    id?: string;
    role?: string | null;
    isEscrowGuide?: boolean;
  },
  postAuthor?: {
    id?: string;
    role?: string | null;
    isEscrowGuide?: boolean;
  } | null,
): { role?: string | null; isEscrowGuide?: boolean } {
  if (!postAuthor?.id || !commentAuthor.id || postAuthor.id !== commentAuthor.id) {
    return commentAuthor;
  }
  const keys = communityAuthorIdentityKeySet(commentAuthor);
  for (const k of communityAuthorIdentityKeySet(postAuthor)) keys.add(k);
  return syntheticAuthorFromIdentityKeys(keys);
}

function syntheticAuthorFromIdentityKeys(keys: Set<string>): {
  role: string;
  isEscrowGuide?: boolean;
} {
  const primary = communityAuthorPrimaryIdentityFromKeys(keys);
  const role =
    primary === "community_role_admin"
      ? "admin"
      : primary === "community_role_region_steward"
        ? "region_steward"
        : primary === "community_role_provider"
          ? "provider"
          : primary === "community_role_guide"
            ? "guide"
            : primary === "community_role_arbitrator"
              ? "arbitrator"
              : primary === "community_role_traveler"
                ? "traveler"
                : "tourist";
  return {
    role,
    ...(keys.has("community_role_guide") && primary === "community_role_guide"
      ? { isEscrowGuide: true }
      : {}),
  };
}
