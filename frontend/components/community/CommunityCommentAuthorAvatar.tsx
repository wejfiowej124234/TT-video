"use client";

import Image from "next/image";
import type { CommunityComment } from "@/lib/communityMockData";
import {
  communityCommentAuthorDisplayName,
  communityCommentAuthorInitial,
} from "@/lib/communityCommentAuthorUi";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";

export function CommunityCommentAuthorAvatar({
  author,
  guestLabel,
  dash,
  sizeClassName = "h-11 w-11 min-h-[44px] min-w-[44px]",
}: {
  author: CommunityComment["author"];
  guestLabel: string;
  dash: string;
  sizeClassName?: string;
}) {
  const avatarUrl = author.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(author.avatar_url.trim())
    : "";
  const initial = communityCommentAuthorInitial(author, { dash, guestLabel });
  const label = communityCommentAuthorDisplayName(author, { dash, guestLabel });

  return (
    <div
      className={`relative ${sizeClassName} shrink-0 overflow-hidden rounded-full ring-2 ring-ref-sun/30 bg-ink-800`}
      data-testid="community-comment-author-avatar"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          sizes="44px"
          unoptimized={communityMediaNextImageUnoptimized(avatarUrl)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center text-meta font-semibold text-ref-sun/95 ${TT_COMMUNITY_DRAWER_L5.avatarFallback}`}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CommunityCommentAuthorName({
  author,
  guestLabel,
  dash,
  className = "text-meta text-slate-100 font-medium",
}: {
  author: CommunityComment["author"];
  guestLabel: string;
  dash: string;
  className?: string;
}) {
  return (
    <p className={className} data-testid="community-comment-author-name">
      {communityCommentAuthorDisplayName(author, { dash, guestLabel })}
    </p>
  );
}
