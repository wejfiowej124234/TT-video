"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import { DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityCardLinkFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { useTranslation } from "@/components/LocaleProvider";
import {
  formatCommunityPostRelativeTime,
  formatPostDetailLocationLine,
} from "@/components/community/postDetailMetaFormat";
import { communityPostTagDisplayLabel, communityPostTagsForDisplay } from "@/components/community/communityPostTagDisplay";
import { communityFollowPillClassName } from "@/components/community/communityFollowPillClassName";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { useCommunityTopicTagWarm } from "@/lib/useCommunityTopicTagWarm";
import { isShowcasePostId } from "@/lib/communityShowcase";

/** 小红书式右侧信息区：作者 → 正文 → 标签/地点/时间 */
export function PostDetailDrawerMetaSection({
  post,
  t,
  dash,
  isTextOnlyDetail,
  author,
  authorAvatarResolved,
  roleKey,
  authorProfileHref,
  authorFollow,
  topicHref,
  onAfterTopicTagClick,
  onClose,
}: {
  post: CommunityPost;
  t: (key: string) => string;
  dash: string;
  isTextOnlyDetail: boolean;
  author: CommunityPost["author"];
  authorAvatarResolved: string;
  roleKey: string;
  authorProfileHref: string;
  authorFollow?: CommunityFeedCardAuthorFollow;
  topicHref: (tag: string) => string;
  onAfterTopicTagClick?: () => void;
  onClose?: () => void;
}) {
  const { locale } = useTranslation();
  const warmTopicTag = useCommunityTopicTagWarm();
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => {
    setAvatarBroken(false);
  }, [post.id, authorAvatarResolved]);
  const locationLine = formatPostDetailLocationLine(post, t);
  const timeLabel = post.created_at
    ? formatCommunityPostRelativeTime(post.created_at, locale, t)
    : "";
  const isShowcasePost = isShowcasePostId(post.id);

  return (
    <div className="space-y-3.5 px-4 py-4 sm:px-5 sm:py-5">
      {isShowcasePost ? (
        <p className={TT_COMMUNITY_DRAWER_L5.postDetailShowcaseHint} role="note">
          {t("community_showcase_content_hint")}
        </p>
      ) : null}
      <div className="flex items-start gap-2.5">
        <Link
          href={authorProfileHref}
          className={`${TT_COMMUNITY_DRAWER_L5.postDetailAuthorCompact} ${communityCardLinkFocus}`}
        >
          <div className={TT_COMMUNITY_DRAWER_L5.postDetailAuthorAvatar}>
            {authorAvatarResolved && !avatarBroken ? (
              <Image
                src={authorAvatarResolved}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
                loading="lazy"
                unoptimized={communityMediaNextImageUnoptimized(authorAvatarResolved)}
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="text-meta font-medium text-slate-100" aria-hidden>
                {(author?.nickname ?? "?").slice(0, 1)}
              </span>
            )}
          </div>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body font-semibold text-slate-100 truncate">{author?.nickname ?? dash}</span>
            {author?.wallet ? (
              <span className="text-meta font-mono text-slate-400 truncate max-w-[12rem]">{author.wallet}</span>
            ) : null}
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {authorFollow && !authorFollow.hidden ? (
            <form
              className="contents shrink-0"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void authorFollow.onToggle();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="submit"
                disabled={authorFollow.disabled}
                aria-busy={authorFollow.disabled ? true : undefined}
                className={communityFollowPillClassName({
                  followed: authorFollow.followed,
                  disabled: authorFollow.disabled,
                })}
              >
                {authorFollow.followed ? t("community_following") : t("community_follow")}
              </button>
            </form>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className={`hidden md:inline-flex ${TT_COMMUNITY_DRAWER_L5.postDetailCloseFab} ${communitySlatePillFocus}`}
              aria-label={t("community_back_drawer")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={TT_COMMUNITY_DRAWER_L5.postDetailRoleBadge}>{t(roleKey)}</span>
        {isShowcasePost ? (
          <span className={TT_COMMUNITY_DRAWER_L5.postDetailShowcaseBadge}>{t("community_feed_showcase_badge")}</span>
        ) : null}
        {author?.isEscrowGuide ? (
          <span
            className={`pointer-events-none shrink-0 ${TT_COMMUNITY_DRAWER_L5.postDetailRoleBadge} border border-warning/35 bg-warning/12 text-slate-100`}
            aria-hidden
          >
            {t("community_badge_escrow_guide")}
          </span>
        ) : null}
        {author?.id && (author.role === "guide" || author.isEscrowGuide) ? (
          <Link
            href={marketHrefForCommunityUser(author.id)}
            className={`${TT_COMMUNITY_DRAWER_L5.postDetailBookGuideChip} ${communityCardLinkFocus}`}
          >
            {t("community_book_guide_cta")}
          </Link>
        ) : null}
      </div>

      {post.title ? <h3 className="text-h4 font-semibold text-slate-100 leading-snug">{post.title}</h3> : null}
      {!isTextOnlyDetail ? (
        <p className={TT_COMMUNITY_DRAWER_L5.postDetailMetaBody}>{post.content}</p>
      ) : null}

      {(post.tags ?? []).length > 0 || post.destination || post.evidenceAnchored ? (
        <div className="flex flex-wrap gap-2">
          {post.destination ? (
            <span className={TT_COMMUNITY_DRAWER_L5.postDetailDestinationChip}>
              {DESTINATION_LABEL_KEYS[post.destination] ? t(DESTINATION_LABEL_KEYS[post.destination]) : post.destination}
            </span>
          ) : null}
          {communityPostTagsForDisplay(post.tags).map((tag) => {
            const label = communityPostTagDisplayLabel(tag);
            return (
            <Link
              key={tag}
              href={topicHref(tag)}
              prefetch={true}
              onPointerEnter={() => warmTopicTag(tag)}
              onClick={() => onAfterTopicTagClick?.()}
              className={`${TT_COMMUNITY_DRAWER_L5.postDetailTagChipCompact} ${communityShellTabFocus}`}
              aria-label={`${t("community_tag_filter_aria")} #${label}`}
            >
              #{label}
            </Link>
            );
          })}
          {post.evidenceAnchored ? (
            <span className="rounded-full border border-success/45 bg-success/10 px-2 py-0.5 text-meta text-success/95">
              {t("community_badge_evidence_anchored")}
            </span>
          ) : null}
        </div>
      ) : null}

      {locationLine || timeLabel ? (
        <p className="text-meta text-slate-500">
          {[locationLine, timeLabel].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
