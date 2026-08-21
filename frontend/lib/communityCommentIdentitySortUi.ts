import type { CommunityComment } from "@/lib/communityMockData";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";

/**
 * R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1
 * Comment author row: one identity badge 「向导」 only (no 托管向导 + 预约向导 double pills).
 */
export const COMMUNITY_COMMENT_GUIDE_IDENTITY_CLASS =
  "pointer-events-auto rounded-full border border-sky-400/50 bg-sky-500/20 px-2 py-0.5 text-meta text-sky-100 font-medium";

/** Reply / Delete on dark ink — force high-contrast white (forbid dark ink on ink). */
export const COMMUNITY_COMMENT_ACTION_REPLY_CLASS =
  "shrink-0 text-meta text-slate-100 hover:text-white motion-sub min-h-[44px] px-2 rounded-[var(--radius-md)] inline-flex items-center justify-center";

export const COMMUNITY_COMMENT_ACTION_DELETE_CLASS =
  "shrink-0 text-meta text-slate-100 hover:text-white motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center";

/** Douyin-like · post author reply/comment badge */
export const COMMUNITY_COMMENT_CREATOR_BADGE_CLASS =
  "rounded-full border border-amber-400/55 bg-amber-500/15 px-2 py-0.5 text-meta text-amber-100 font-medium";

export const COMMUNITY_COMMENT_ACTION_REPORT_CLASS =
  "shrink-0 text-meta text-slate-200 hover:text-white motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center";

/** Default list order: engagement (reply-count / hot) then chronological ASC. No UI sort tabs. */
export const COMMUNITY_COMMENT_DEFAULT_SORT = "hot" as const;

export function communityCommentAuthorIsGuide(
  author: CommunityComment["author"] | null | undefined,
): boolean {
  if (!author) return false;
  return author.role === "guide" || Boolean(author.isEscrowGuide);
}

export function communityCommentGuideMarketHref(
  author: CommunityComment["author"] | null | undefined,
): string | null {
  if (!author?.id || !communityCommentAuthorIsGuide(author)) return null;
  return marketHrefForCommunityUser(author.id);
}

export function communityCommentGuideIdentityClassName(): string {
  return `${COMMUNITY_COMMENT_GUIDE_IDENTITY_CLASS} ${communityCardLinkFocus}`;
}

/** Non-guide comment identity pill (管理员 / 主理人 / 商家 / 旅行者). */
export function communityCommentRoleIdentityClassName(): string {
  return "rounded-full border border-white/20 bg-white/[0.08] px-2 py-0.5 text-meta text-slate-200 font-medium";
}
