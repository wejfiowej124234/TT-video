"use client";

import Link from "next/link";
import type { CommunityComment, CommunityPostAuthor } from "@/lib/communityMockData";
import {
  communityAuthorIdentityForComment,
  communityAuthorIdentityI18nKeys,
} from "@/lib/meRoleDisplay";
import {
  communityCommentGuideIdentityClassName,
  communityCommentGuideMarketHref,
  communityCommentRoleIdentityClassName,
} from "@/lib/communityCommentIdentitySortUi";

/** One identity pill after「创作者」: highest of 管理员 > 区域主理人 > 商家 > 向导 > 旅行者. */
export function CommunityCommentGuideIdentityBadge({
  author,
  t,
  postAuthor,
}: {
  author: CommunityComment["author"];
  t: (key: string) => string;
  postAuthor?: CommunityPostAuthor | null;
}) {
  const identityAuthor = communityAuthorIdentityForComment(author, postAuthor);
  const key = communityAuthorIdentityI18nKeys(identityAuthor)[0];
  if (!key) return null;
  const label = t(key);
  const guideAuthor =
    key === "community_role_guide"
      ? { ...author, role: "guide" as const, isEscrowGuide: true }
      : null;
  const href = guideAuthor ? communityCommentGuideMarketHref(guideAuthor) : null;
  const className =
    key === "community_role_guide"
      ? communityCommentGuideIdentityClassName()
      : communityCommentRoleIdentityClassName();
  if (href) {
    return (
      <Link href={href} className={className} data-testid="community-comment-guide-identity">
        {label}
      </Link>
    );
  }
  return (
    <span
      className={className}
      data-testid={
        key === "community_role_guide" ? "community-comment-guide-identity" : "community-comment-role-identity"
      }
    >
      {label}
    </span>
  );
}
