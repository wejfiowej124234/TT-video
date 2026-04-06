"use client";

import { useState, useRef, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT } from "@/components/community/communityFeedConstants";
import {
  communityCardLinkFocus,
  communityConversationRowFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { CommunityPostShareMenu } from "@/components/community/CommunityPostShareMenu";

/** 小红书式紧凑卡片：网格用；支持双击点赞；底部可选真实关注（04 §3.4） */
export function CommunityFeedCardCompact({
  post,
  t,
  onViewFull,
  onPlayVideo,
  authorFollow,
  liked: controlledLiked,
  onLike,
  onReport,
  topicTagHref,
}: {
  post: CommunityPost;
  commentCount?: number;
  t: (key: string) => string;
  onViewFull?: (post: CommunityPost, trigger?: HTMLElement) => void;
  onPlayVideo?: (post: CommunityPost, trigger?: HTMLElement) => void;
  authorFollow?: CommunityFeedCardAuthorFollow;
  /** 与 Feed 大卡一致：传入时双击点赞走 API 乐观更新 */
  liked?: boolean;
  onLike?: () => void;
  onReport?: (post: CommunityPost) => void;
  topicTagHref?: (tag: string) => string;
}) {
  const topicHref =
    topicTagHref ?? ((tag: string) => `/community/topic/${encodeURIComponent(tag)}`);
  const dash = t("ui_em_dash");
  const { title, content, media_url, media_urls, is_video, author, likes, type } = post;
  const images = media_urls && media_urls.length > 0 ? media_urls : (media_url ? [media_url] : []);
  const coverStill = post.cover_url?.trim() || "";
  const thumb =
    is_video && coverStill ? coverStill : (images[0] ?? media_url);
  const isTextOnly = type === "text" && !thumb;
  const [localLiked, setLocalLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const justLikedRef = useRef(false);
  const liked = onLike !== undefined ? (controlledLiked ?? false) : localLiked;
  const displayLikes = liked ? likes + 1 : likes;

  const handleDoubleTapLike = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      if (onLike) {
        if (!liked) onLike();
      } else {
        setLocalLiked(true);
      }
      setShowHeart(true);
      justLikedRef.current = true;
      setTimeout(() => setShowHeart(false), 700);
      setTimeout(() => { justLikedRef.current = false; }, 500);
    }
    lastTapRef.current = now;
  };

  const openFromPreview = (submitter: HTMLElement | null) => {
    if (justLikedRef.current) return;
    if (post.is_video && onPlayVideo && submitter) {
      onPlayVideo(post, submitter);
    } else if (onViewFull && submitter) {
      onViewFull(post, submitter);
    }
  };

  return (
    <article
      className="rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-900/70 overflow-hidden shadow-scifi-card-faint motion-sub hover:border-cyan-500/40 hover:shadow-scifi-card-faint-hover"
      aria-labelledby={`${post.id}-compact-title`}
    >
      <form
        className="block w-full"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          openFromPreview(sub);
        }}
      >
        <button
          type="submit"
          className={`w-full text-left block ${communityConversationRowFocus}`}
          aria-label={title || content?.slice(0, 30) || t("community_view_full")}
        >
          <div
            className="relative aspect-[3/4] bg-slate-800/80 select-none"
            onDoubleClick={handleDoubleTapLike}
            onTouchEnd={handleDoubleTapLike}
            role="img"
            aria-hidden
          >
            {showHeart && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200" aria-hidden>
                <svg className="h-14 w-14 text-white drop-shadow-on-dark opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
            )}
            {thumb ? (
              <Image
                src={thumb}
                alt={(title || content || "").slice(0, 40)}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                loading="lazy"
                unoptimized={thumb.startsWith("blob:")}
              />
            ) : isTextOnly ? (
              <div className="absolute inset-0 flex flex-col justify-end p-2 bg-gradient-to-t from-slate-900 via-slate-800/95 to-slate-800/80" aria-hidden>
                <span className="text-[0.65rem] font-medium text-fuchsia-200 mb-1">{t("community_type_text")}</span>
                <p className="text-[0.7rem] text-slate-300 line-clamp-6 leading-snug whitespace-pre-wrap">{(content || title || dash).slice(0, 200)}</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-small" aria-hidden>
                {dash}
              </div>
            )}
            {is_video && (
              <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white/90" aria-hidden>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </span>
            )}
            {!is_video && images.length > 1 && (
              <span
                className="pointer-events-none absolute top-1.5 right-1.5 rounded-[var(--radius-md)] bg-black/60 px-1 py-0.5 text-[0.6rem] font-medium leading-none text-white/95"
                aria-hidden
              >
                {t("community_compact_multi_photo").replace("{{count}}", String(images.length))}
              </span>
            )}
          </div>
          <div className="px-2 pt-2 pb-1">
            <p id={`${post.id}-compact-title`} className="text-small text-slate-200 line-clamp-1">
              {title || content?.slice(0, 24) || dash}
            </p>
          </div>
        </button>
      </form>
      {(post.tags ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-1 px-2 pb-1" role="list" aria-label={t("community_compact_tags")}>
          {(post.tags ?? []).slice(0, 2).map((tag) => (
            <Link
              key={tag}
              href={topicHref(tag)}
              role="listitem"
              className={`max-w-[45%] truncate rounded-full border border-cyan-500/35 bg-slate-800/80 px-2 py-1 text-micro font-medium leading-tight text-slate-300 motion-sub hover:border-cyan-400/60 hover:text-cyan-100 inline-flex min-h-[44px] items-center justify-center ${communityShellTabFocus}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`${t("community_tag_filter_aria")} #${tag}`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-1 px-2 pb-2">
        <Link
          href={author?.id ? `/community/user/${author.id}` : "/community"}
          className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-start gap-1.5 py-0.5 motion-sub hover:text-cyan-100 rounded-sm ${communityCardLinkFocus}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={author?.nickname ?? ""}
        >
          {author?.avatar_url ? (
            <span className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
              <Image src={author.avatar_url} alt="" fill className="object-cover" sizes="20px" unoptimized />
            </span>
          ) : (
            <span className="h-5 w-5 flex-shrink-0 rounded-full bg-slate-600" aria-hidden />
          )}
          <span className="flex min-w-0 flex-col gap-0.5 text-left">
            <span className="text-meta text-slate-300 truncate">{author?.nickname ?? dash}</span>
            {author?.wallet ? (
              <span className="text-[0.65rem] font-mono text-slate-500 truncate max-w-[7rem]" aria-hidden>
                {author.wallet}
              </span>
            ) : null}
          </span>
        </Link>
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
              className={
                "inline-flex shrink-0 min-h-[44px] items-center justify-center rounded-full border px-2 py-1 text-micro font-medium leading-tight motion-sub " +
                (authorFollow.followed
                  ? `border-slate-500 bg-slate-700/60 text-slate-300 ${communitySlatePillFocus}`
                  : `border-cyan-400/50 bg-cyan-500/20 text-cyan-300 ${communityCyanPillFocus}`) +
                (authorFollow.disabled ? " opacity-60 cursor-wait" : "")
              }
            >
              {authorFollow.followed ? t("community_following") : t("community_follow")}
            </button>
          </form>
        ) : null}
        {(author?.role === "guide" || author?.isEscrowGuide) && author?.id ? (
          <Link
            href={marketHrefForCommunityUser(author.id)}
            onClick={(e) => e.stopPropagation()}
            className={COMMUNITY_BOOK_GUIDE_CTA_CLASS_COMPACT}
          >
            {t("community_book_guide_cta")}
          </Link>
        ) : null}
        <div className="ml-auto flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <CommunityPostShareMenu post={post} t={t} onReport={onReport} placement="up" />
          <span className="flex shrink-0 items-center gap-0.5 text-meta text-slate-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {displayLikes}
          </span>
        </div>
      </div>
    </article>
  );
}
