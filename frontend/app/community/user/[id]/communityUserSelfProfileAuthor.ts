import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityPostAuthor, CommunityPostUserVisibility } from "@/lib/communityMockData";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";

/** Self profile chrome from GET /me — not from the current visibility filter's first post. */
export function communityUserSelfProfileAuthor(
  meUser: CommunityMeUser | null | undefined,
  profileId: string,
): CommunityPostAuthor | undefined {
  if (!meUser?.id || meUser.id !== profileId) return undefined;
  const nickname = typeof meUser.nickname === "string" ? meUser.nickname.trim() : "";
  const roleRaw = typeof meUser.role === "string" ? meUser.role.trim() : "";
  const wallet = formatWalletOrDidShort(meUser.default_wallet_address) ?? undefined;
  return {
    id: meUser.id,
    nickname,
    avatar_url: meUser.avatar_url ?? null,
    role: roleRaw || "tourist",
    wallet,
  };
}

/** Prefer GET /me; fill gaps from a post on this account so empty 仅自己/归档 cannot become 游客. */
export function mergeCommunitySelfProfileAuthor(
  fromMe: CommunityPostAuthor | undefined,
  fromPost: CommunityPostAuthor | undefined,
): CommunityPostAuthor | undefined {
  if (!fromMe && !fromPost) return undefined;
  if (!fromMe) return fromPost;
  if (!fromPost) return fromMe;
  const nickMe = fromMe.nickname.trim();
  const nickPost = fromPost.nickname.trim();
  const roleMe = fromMe.role.trim();
  const rolePost = fromPost.role.trim();
  const role = roleMe && roleMe !== "tourist" ? roleMe : rolePost || roleMe || "tourist";
  return {
    id: fromMe.id,
    nickname: nickMe || nickPost,
    avatar_url: fromMe.avatar_url?.trim() ? fromMe.avatar_url : fromPost.avatar_url,
    role,
    wallet: fromMe.wallet || fromPost.wallet,
    ...(fromMe.isEscrowGuide === true || fromPost.isEscrowGuide === true ? { isEscrowGuide: true } : {}),
  };
}

export function communityUserPostsEmptyI18nKey(
  isSelf: boolean,
  vis: "all" | CommunityPostUserVisibility,
): string {
  if (!isSelf) return "community_empty";
  if (vis === "private") return "community_me_posts_empty_private";
  if (vis === "archived") return "community_me_posts_empty_archived";
  if (vis === "public") return "community_me_posts_empty_public";
  return "community_empty";
}

export function communityUserProfileDisplayName(
  profileAuthor: CommunityPostAuthor | undefined,
  profileId: string,
): string {
  const nick = profileAuthor?.nickname?.trim();
  if (nick) return nick;
  return profileId.slice(0, 8);
}
