"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS, DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityCardLinkFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { communityFollowPillClassName } from "@/components/community/communityFollowPillClassName";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { isShowcasePostId } from "@/lib/communityShowcase";
import { COMMUNITY_AUTHOR_WALLET_CLASS } from "@/lib/communityCommentAuthorUi";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

export type CommunityFeedCardContentProps = {
  post: CommunityPost;
  destination: string | undefined;
  tags: string[];
  roleKey: string;
  t: (key: string) => string;
  followed: boolean;
  /** 未提供 `onFollowPress` 时用于本地 Mock（收藏页等） */
  setFollowed?: (v: boolean) => void;
  /** 提供时走真实关注流（如首页 Feed + `postUserFollow`） */
  onFollowPress?: () => void | Promise<void>;
  followDisabled?: boolean;
  /** 本人帖或匿名作者：不展示关注按钮 */
  followHidden?: boolean;
  onViewFull?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onTagClick?: (tag: string) => void;
  /** 31 §2.3：本人主页等场景展示非公开状态 */
  showVisibilityStatusBadge?: boolean;
};

/** Feed 卡片文案区：标题、正文、目的地、标签、作者行；从 CommunityFeedCard 拆出 */
export default function CommunityFeedCardContent(props: CommunityFeedCardContentProps) {
  const {
    post,
    destination,
    tags,
    roleKey,
    t,
    followed,
    setFollowed,
    onFollowPress,
    followDisabled,
    followHidden,
    onViewFull,
    onTagClick,
    showVisibilityStatusBadge,
  } = props;
  const dash = t("ui_em_dash");
  const { id, title, content, author } = post;
  const isShowcasePost = isShowcasePostId(id);
  return (
    <div className="p-3 sm:p-4">
      <div id={id} className="mb-3">
        {title && <h3 className="text-body font-semibold text-slate-200 mb-1 line-clamp-1">{title}</h3>}
        <UgcTranslatedText
          as="p"
          className="text-small text-slate-300 line-clamp-2"
          policy="on_demand"
          contentClass="community_post"
          contentId={id}
          field="body"
          originalText={content}
        />
        {onViewFull && (
          <form
            className="contents"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
              onViewFull(post, sub ?? undefined);
            }}
          >
            <button
              type="submit"
              className={`${touchTargetLink44Classes} !justify-start text-meta text-ref-sun/90 hover:text-ref-sun/95 mt-1 motion-sub rounded-sm ${communityCardLinkFocus}`}
            >
              {t("community_view_full")} →
            </button>
          </form>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {destination && (
          <span className={TT_COMMUNITY_DRAWER_L5.destinationBadge}>{DESTINATION_LABEL_KEYS[destination] ? t(DESTINATION_LABEL_KEYS[destination]) : destination}</span>
        )}
        {tags.slice(0, 3).map((tag) =>
          onTagClick ? (
            <form
              key={tag}
              className="contents"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                onTagClick(tag);
              }}
            >
              <button
                type="submit"
                className={`${TT_COMMUNITY_DRAWER_L5.tagChip} ${communityShellTabFocus}`}
                aria-label={`${t("community_tag_filter_aria")} #${tag}`}
              >
                #{tag}
              </button>
            </form>
          ) : (
            <span
              key={tag}
              className={TT_COMMUNITY_DRAWER_L5.tagChipStatic}
            >
              #{tag}
            </span>
          )
        )}
        {post.evidenceAnchored ? (
          <span className="rounded-full border border-success/45 bg-success/10 px-2 py-0.5 text-meta text-success/95" title={t("community_badge_evidence_anchored")}>
            {t("community_badge_evidence_anchored")}
          </span>
        ) : null}
        {showVisibilityStatusBadge && (post.visibilityStatus ?? "public") === "private" ? (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/95">
            {t("community_me_posts_badge_private")}
          </span>
        ) : null}
        {showVisibilityStatusBadge && post.visibilityStatus === "archived" ? (
          <span className={TT_COMMUNITY_DRAWER_L5.archivedBadge}>
            {t("community_me_posts_badge_archived")}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {author && (
          <>
            <Link
              href={author.id ? `/community/user/${author.id}` : "/community"}
              className={`flex min-h-[44px] items-center justify-start gap-2 min-w-0 group rounded-sm ${communityCardLinkFocus}`}
              aria-label={author.nickname ?? ""}
            >
              <div className={`relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full overflow-hidden flex-shrink-0 ${TT_COMMUNITY_DRAWER_L5.avatarRing}`}>
                {author.avatar_url ? <Image src={author.avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized /> : <div className={TT_COMMUNITY_DRAWER_L5.avatarFallback} />}
              </div>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-small font-medium text-slate-100 truncate group-hover:text-ref-sun/95 motion-sub">{author.nickname ?? dash}</span>
                {author.wallet ? (
                  <span
                    className={`${COMMUNITY_AUTHOR_WALLET_CLASS} truncate max-w-[11rem] group-hover:text-slate-100`}
                    aria-hidden
                    data-testid="community-author-wallet"
                  >
                    {author.wallet}
                  </span>
                ) : null}
              </span>
            </Link>
            <span
              className={
                isShowcasePost
                  ? TT_COMMUNITY_DRAWER_L5.postDetailRoleBadge
                  : author.role === "guide"
                    ? TT_COMMUNITY_DRAWER_L5.roleGuide
                    : TT_COMMUNITY_DRAWER_L5.roleTourist
              }
            >
              {t(roleKey)}
            </span>
            {isShowcasePost ? (
              <span className={TT_COMMUNITY_DRAWER_L5.postDetailShowcaseBadge}>{t("community_feed_showcase_badge")}</span>
            ) : null}
            {author.isEscrowGuide && (
              <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">{t("community_badge_escrow_guide")}</span>
            )}
            {(author.role === "guide" || author.isEscrowGuide) && author.id ? (
              <Link href={marketHrefForCommunityUser(author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                {t("community_book_guide_cta")}
              </Link>
            ) : null}
          </>
        )}
        {!followHidden ? (
          <form
            className="contents ml-auto"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              if (onFollowPress) void onFollowPress();
              else setFollowed?.(!followed);
            }}
          >
            <button
              type="submit"
              disabled={followDisabled}
              aria-busy={followDisabled ? true : undefined}
              className={communityFollowPillClassName({
                followed,
                disabled: followDisabled,
              })}
            >
              {followed ? t("community_following") : t("community_follow")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
