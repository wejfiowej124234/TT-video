import type { CommunityComment } from "@/lib/communityMockData";

/** UI-HYG-COMM-COMMENT-WALLET-CONTRAST-1 · dark ink card */
export const COMMUNITY_AUTHOR_WALLET_CLASS =
  "text-meta font-mono text-slate-200 hover:text-slate-100 focus-visible:text-slate-100";

/** 评论作者展示名（乐观评论 / 无头像时亦须可读） */
export function communityCommentAuthorDisplayName(
  author: CommunityComment["author"],
  opts: { dash: string; guestLabel: string },
): string {
  const nick = (author.nickname ?? "").trim();
  if (nick && nick !== opts.dash) return nick;
  if (author.id && author.id !== "unknown" && author.id !== "local-guest") {
    return author.id.slice(0, 8);
  }
  return opts.guestLabel;
}

export function communityCommentAuthorInitial(
  author: CommunityComment["author"],
  opts: { dash: string; guestLabel: string },
): string {
  const label = communityCommentAuthorDisplayName(author, opts);
  const ch = label.trim().charAt(0);
  return ch && ch !== "—" && ch !== "–" ? ch.toUpperCase() : "?";
}
