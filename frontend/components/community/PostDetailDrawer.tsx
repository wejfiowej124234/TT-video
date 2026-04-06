"use client";

import { useState, useEffect, useRef, useCallback, useId, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityComment, CommunityPostVisibility } from "@/lib/communityMockData";
import type { CommunityFeedCardAuthorFollow } from "@/components/community/CommunityFeedCard";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS, DESTINATION_LABEL_KEYS } from "./communityFeedConstants";
import { CommunityPostShareMenu } from "./CommunityPostShareMenu";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityAmberPillFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityShellTabFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";

const COMMENT_SORT_TABS = ["chronological", "latest", "hot"] as const satisfies readonly CommunityCommentSort[];

/** 31 附录：帖子详情抽屉——完整媒体轮播 + 全文 + 作者 + 评论区；未登录时禁用发送 */
export function PostDetailDrawer({
  post,
  comments,
  commentCount,
  onClose,
  onCommentSend,
  t,
  isLoggedIn = false,
  /** getMe 未完成时不展示「去登录」条 */
  authPending = false,
  onReport,
  commentSendError,
  commentSendErrorMessage,
  commentFieldMessages,
  onRetryComment,
  commentsLoadError,
  onRetryCommentsLoad,
  commentSort,
  onCommentSortChange,
  authorFollow,
  onAfterTopicTagClick,
  /** B-077：与 Feed `sort=` 一致；缺省为无 query 的话题路径 */
  topicTagHref,
  onDeletePost,
  deletePostBusy,
  onPostVisibilityChange,
  postVisibilityBusy,
  meUserId,
  onReportComment,
  liked,
  collected,
  onLike,
  onCollect,
}: {
  post: CommunityPost;
  comments: CommunityComment[];
  commentCount?: number;
  onClose: () => void;
  onCommentSend: (content: string) => void | Promise<void>;
  t: (key: string) => string;
  isLoggedIn?: boolean;
  authPending?: boolean;
  /** 与 Feed 同源：须同时传 `onCollect` 才展示详情内点赞/收藏 */
  liked?: boolean;
  collected?: boolean;
  onLike?: () => void;
  onCollect?: () => void;
  onReport?: (post: CommunityPost) => void;
  commentSendError?: boolean;
  commentSendErrorMessage?: string | null;
  /** 后端 `errors` 已映射文案（如 body） */
  commentFieldMessages?: Record<string, string> | null;
  onRetryComment?: () => void;
  commentsLoadError?: string | null;
  onRetryCommentsLoad?: () => void;
  commentSort?: CommunityCommentSort;
  onCommentSortChange?: (s: CommunityCommentSort) => void;
  authorFollow?: CommunityFeedCardAuthorFollow;
  /** 点击话题跳转话题聚合页前关闭抽屉（`/community/topic/…`） */
  onAfterTopicTagClick?: () => void;
  topicTagHref?: (tag: string) => string;
  /** 31 §2.3：仅「我的帖子」等场景传入；展示删除入口 */
  onDeletePost?: () => void | Promise<void>;
  deletePostBusy?: boolean;
  /** 与 `onDeletePost` 同场景：作者修改可见性 */
  onPostVisibilityChange?: (next: CommunityPostVisibility) => void | Promise<void>;
  postVisibilityBusy?: boolean;
  meUserId?: string | null;
  onReportComment?: (comment: CommunityComment) => void;
}) {
  const topicHref =
    topicTagHref ?? ((tag: string) => `/community/topic/${encodeURIComponent(tag)}`);
  const dash = t("ui_em_dash");
  const showPostInteractions = typeof onLike === "function" && typeof onCollect === "function";
  const likedState = liked ?? false;
  const collectedState = collected ?? false;
  const displayLikes = likedState ? post.likes + 1 : post.likes;
  const displayCollects = collectedState ? post.collects + 1 : post.collects;
  const interactionDisabled = !isLoggedIn || authPending;
  const displayCommentCount = commentCount ?? post.comments;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDetailHeart, setShowDetailHeart] = useState(false);
  const lastDetailTapRef = useRef(0);
  const likedStateRef = useRef(likedState);
  likedStateRef.current = likedState;
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const carouselTouchStartX = useRef<number | null>(null);
  const containerRef = useFocusTrap(true, onClose);
  const drawerTitleId = useId();
  const drawerDescId = useId();
  const postVisibilitySelectId = useId();
  const commentSendErrorNoticeId = useId();
  const commentBodyErrorNoticeId = useId();
  const commentComposerInputId = useId();
  const images = post.media_urls?.length ? post.media_urls : (post.media_url ? [post.media_url] : []);
  const currentImage = images.length > 0 ? images[carouselIndex % images.length] : "";
  /** 51-31-20：详情内视频帖可播 */
  const videoUrl = post.is_video && images.length > 0 ? images[0] : null;
  const videoPoster = post.cover_url?.trim() || undefined;
  const author = post.author;
  const roleKey = communityStoredRoleLabelI18nKey(author?.role);
  const authorProfileHref = author?.id ? `/community/user/${author.id}` : "/community";
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);
  const showReportComment = (c: CommunityComment) =>
    Boolean(onReportComment && (!meUserId || c.author.id !== meUserId));
  const imageCarouselCount = images.length;
  const isTextOnlyDetail = post.type === "text" && images.length === 0;

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [carouselIndex]);

  useEffect(() => {
    lastDetailTapRef.current = 0;
    setShowDetailHeart(false);
  }, [post.id]);

  /** 与 CommunityFeedCardMedia 一致：400ms 内第二次点/触发心形 + 未赞时调 onLike（视频区不启用） */
  const handleDetailDoubleTapLike = useCallback(() => {
    if (!showPostInteractions || interactionDisabled) return;
    const now = Date.now();
    if (now - lastDetailTapRef.current < 400) {
      setShowDetailHeart(true);
      window.setTimeout(() => setShowDetailHeart(false), 700);
      if (!likedStateRef.current) onLike?.();
    }
    lastDetailTapRef.current = now;
  }, [showPostInteractions, interactionDisabled, onLike]);

  const handleDetailCarouselKeyDown = (e: React.KeyboardEvent) => {
    if (videoUrl || imageCarouselCount <= 1) return;
    const n = imageCarouselCount;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCarouselIndex((i) => (i - 1 + n) % n);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCarouselIndex((i) => (i + 1) % n);
    } else if (e.key === "Home") {
      e.preventDefault();
      setCarouselIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCarouselIndex(n - 1);
    }
  };

  const handleSend = async () => {
    if (!isLoggedIn || authPending || sending) return;
    const v = input.trim();
    if (!v) return;
    setSending(true);
    const payload = v;
    setInput("");
    try {
      await Promise.resolve(onCommentSend(payload));
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("PostDetailDrawer handleSend:", err);
      }
      setInput(payload);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-sm overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
    >
      {/* 顶部栏：返回 + 标题，safe-area */}
      <div className="flex shrink-0 items-center justify-between border-b border-cyan-500/30 bg-slate-900/95 px-4 py-3 safe-area-inset-t min-h-[48px]">
        <form
          className="inline shrink-0"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            ref={backButtonRef}
            type="submit"
            className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-meta text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 motion-sub shrink-0 min-h-[44px] ${communitySlatePillFocus}`}
            aria-label={t("community_back_drawer")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t("community_back_drawer")}</span>
          </button>
        </form>
        <h2 id={drawerTitleId} className="text-body font-semibold text-cyan-200 truncate min-w-0 flex-1 text-center px-2">
          {post.title || t("community_type_" + post.type)}
        </h2>
        {onDeletePost ? (
          <div className="flex shrink-0 items-center gap-2">
            {onPostVisibilityChange ? (
              <>
                <label htmlFor={postVisibilitySelectId} className="sr-only">
                  {t("community_post_visibility_label")}
                </label>
                <select
                  id={postVisibilitySelectId}
                  disabled={postVisibilityBusy}
                  aria-busy={postVisibilityBusy ? true : undefined}
                  value={post.visibilityStatus ?? "public"}
                  onChange={(e) => void onPostVisibilityChange(e.target.value as CommunityPostVisibility)}
                  className={`inline-flex max-w-[7.5rem] min-h-[44px] items-center justify-start sm:max-w-none rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/90 px-2 py-2 text-meta text-slate-200 disabled:opacity-50 ${communitySlatePillFocus}`}
                >
                  <option value="public">{t("community_post_visibility_public")}</option>
                  <option value="private">{t("community_post_visibility_private")}</option>
                  <option value="archived">{t("community_post_visibility_archived")}</option>
                </select>
              </>
            ) : null}
            <form
              className="inline shrink-0"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                void onDeletePost();
              }}
            >
              <button
                type="submit"
                disabled={deletePostBusy}
                aria-busy={deletePostBusy ? true : undefined}
                className="shrink-0 rounded-[var(--radius-md)] border border-danger/50 bg-danger/20 px-2.5 py-2 text-meta text-danger/95 hover:bg-danger/30 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={t("community_delete_post")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="w-11 sm:w-20 shrink-0" aria-hidden />
        )}
      </div>

      <p id={drawerDescId} className="sr-only">
        {t("community_view_full")}
      </p>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isTextOnlyDetail ? (
          <div
            className="relative min-h-[9rem] shrink-0 border-b border-slate-600/40 bg-gradient-to-br from-slate-800/95 to-slate-900/90 px-4 py-5 select-none"
            onDoubleClick={handleDetailDoubleTapLike}
          >
            {showDetailHeart && showPostInteractions ? (
              <span
                className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-200"
                aria-hidden
              >
                <svg
                  className="h-16 w-16 text-fuchsia-200 drop-shadow-on-dark opacity-90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
            ) : null}
            <span className="pointer-events-none inline-block rounded-full border border-fuchsia-400/45 bg-slate-900/80 px-2.5 py-0.5 text-meta text-fuchsia-200" aria-hidden>
              {t("community_type_text")}
            </span>
            <p className="mt-3 text-body text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            {showPostInteractions ? (
              <p className="mt-2 text-meta text-slate-400">{t("community_text_double_tap_hint")}</p>
            ) : null}
          </div>
        ) : (
        <div
          className="relative aspect-[4/3] bg-slate-800/80 shrink-0 touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset select-none"
          onDoubleClick={videoUrl ? undefined : handleDetailDoubleTapLike}
          onTouchStart={(e) => {
            if (videoUrl) return;
            carouselTouchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (videoUrl) return;
            if (images.length > 1) {
              const start = carouselTouchStartX.current;
              carouselTouchStartX.current = null;
              if (start != null) {
                const endX = e.changedTouches[0]?.clientX;
                if (endX != null) {
                  const dx = endX - start;
                  const threshold = 48;
                  if (Math.abs(dx) >= threshold) {
                    const n = images.length;
                    if (dx > 0) setCarouselIndex((i) => (i - 1 + n) % n);
                    else setCarouselIndex((i) => (i + 1) % n);
                    return;
                  }
                }
              }
            } else {
              carouselTouchStartX.current = null;
            }
            handleDetailDoubleTapLike();
          }}
          onKeyDown={handleDetailCarouselKeyDown}
          tabIndex={!videoUrl && images.length > 1 ? 0 : undefined}
          role={!videoUrl && images.length > 1 ? "region" : undefined}
          aria-label={
            !videoUrl && images.length > 1
              ? `${(post.title || post.content || "").slice(0, 30)} · ${t("community_carousel")}`
              : undefined
          }
          aria-roledescription={!videoUrl && images.length > 1 ? t("community_carousel") : undefined}
          aria-keyshortcuts={!videoUrl && images.length > 1 ? "ArrowLeft ArrowRight Home End" : undefined}
        >
          {!videoUrl && images.length > 1 ? (
            <span className="sr-only">{t("community_carousel_keyboard_hint")}</span>
          ) : null}
          {showDetailHeart && showPostInteractions && !videoUrl ? (
            <span
              className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none animate-in zoom-in duration-200"
              aria-hidden
            >
              <svg
                className="h-20 w-20 text-white drop-shadow-on-dark opacity-90"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
          ) : null}
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={videoPoster}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-contain bg-black"
              aria-label={post.title || t("community_video_placeholder")}
            />
          ) : !imageError && currentImage ? (
            <Image
              src={currentImage}
              alt={(post.title || post.content || "").slice(0, 30)}
              fill
              className="object-cover"
              sizes="100vw"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : !currentImage && !imageError ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-small">{t("community_media_load_failed")}</div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-small" role="img" aria-label={t("community_media_load_failed")}>
              {t("community_media_load_failed")}
            </div>
          )}
          {!videoUrl && images.length > 1 && (
            <>
              <form
                className="contents"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setCarouselIndex((i) => (i - 1 + images.length) % images.length);
                }}
              >
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-label={t("community_prev_image")}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                </button>
              </form>
              <form
                className="contents"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  setCarouselIndex((i) => (i + 1) % images.length);
                }}
              >
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  aria-label={t("community_next_image")}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" /></svg>
                </button>
              </form>
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden>
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === carouselIndex % images.length ? "w-4 bg-cyan-400" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        )}

        <div className="p-4 sm:p-5 space-y-3">
          {post.title && <h3 className="text-h4 font-semibold text-slate-100">{post.title}</h3>}
          {!isTextOnlyDetail ? (
            <p className="text-small text-slate-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {post.destination && (
              <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 text-meta text-fuchsia-300">{DESTINATION_LABEL_KEYS[post.destination] ? t(DESTINATION_LABEL_KEYS[post.destination]) : post.destination}</span>
            )}
            {(post.tags ?? []).map((tag) => (
              <Link
                key={tag}
                href={topicHref(tag)}
                onClick={() => onAfterTopicTagClick?.()}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-500/50 bg-slate-800/60 px-2.5 py-1 text-meta text-slate-300 motion-sub hover:border-cyan-500/50 hover:text-cyan-100 ${communityShellTabFocus}`}
                aria-label={`${t("community_tag_filter_aria")} #${tag}`}
              >
                #{tag}
              </Link>
            ))}
            {post.evidenceAnchored ? (
              <span className="rounded-full border border-success/45 bg-success/10 px-2 py-0.5 text-meta text-success/95">{t("community_badge_evidence_anchored")}</span>
            ) : null}
          </div>
          <div className="space-y-3 pt-2 border-t border-slate-600/50">
            {showPostInteractions ? (
              <div className="flex flex-wrap items-center gap-4">
                <form
                  className="inline"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void onLike?.();
                  }}
                >
                  <button
                    type="submit"
                    disabled={interactionDisabled}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 text-meta motion-sub rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus} ${
                      interactionDisabled ? "opacity-50 cursor-not-allowed text-slate-400" : ""
                    } ${likedState ? "text-cyan-300" : "text-slate-300 hover:text-cyan-100"}`}
                    aria-label={t("community_like")}
                  >
                    <svg className="h-4 w-4" fill={likedState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{displayLikes}</span>
                  </button>
                </form>
                <form
                  className="inline"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    void onCollect?.();
                  }}
                >
                  <button
                    type="submit"
                    disabled={interactionDisabled}
                    aria-busy={interactionDisabled ? true : undefined}
                    className={`flex items-center justify-center gap-1.5 text-meta motion-sub min-h-[44px] rounded-[var(--radius-md)] px-1.5 py-1 ${communityShellTabFocus} ${
                      interactionDisabled ? "opacity-50 cursor-not-allowed text-slate-400" : ""
                    } ${collectedState ? "text-fuchsia-300" : "text-slate-300 hover:text-fuchsia-300"}`}
                    aria-label={t("community_collect")}
                  >
                    <svg className="h-4 w-4" fill={collectedState ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                    <span>{displayCollects}</span>
                  </button>
                </form>
              </div>
            ) : null}
            <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={authorProfileHref}
              className={`flex min-h-[44px] min-w-0 items-center justify-start gap-2 py-0.5 pr-2 motion-sub hover:text-cyan-100 rounded-sm ${communityCardLinkFocus}`}
            >
              <div className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-600 ring-2 ring-cyan-400/30">
                {author?.avatar_url ? (
                  <Image src={author.avatar_url} alt="" fill className="object-cover" sizes="44px" loading="lazy" unoptimized />
                ) : (
                  <span className="text-meta font-medium text-cyan-300" aria-hidden>
                    {(author?.nickname ?? "?").slice(0, 1)}
                  </span>
                )}
              </div>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-medium text-slate-200 truncate">{author?.nickname ?? dash}</span>
                {author?.wallet ? (
                  <span className="text-meta font-mono text-slate-400 truncate max-w-[14rem]">{author.wallet}</span>
                ) : null}
              </span>
            </Link>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-meta ${
                author?.role === "guide" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {t(roleKey)}
            </span>
            {author?.isEscrowGuide ? (
              <span
                className="pointer-events-none shrink-0 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90"
                aria-hidden
              >
                {t("community_badge_escrow_guide")}
              </span>
            ) : null}
            {author?.id && (author.role === "guide" || author.isEscrowGuide) ? (
              <Link href={marketHrefForCommunityUser(author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                {t("community_book_guide_cta")}
              </Link>
            ) : null}
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
                    "shrink-0 rounded-full border px-3 py-1 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center " +
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
            <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap justify-end">
              <CommunityPostShareMenu
                post={post}
                t={t}
                placement="down"
                menuClassName="z-[60]"
                triggerClassName={`flex items-center justify-center rounded-[var(--radius-md)] border border-slate-500/60 bg-slate-800/80 min-h-[44px] min-w-[44px] text-meta text-slate-300 hover:text-cyan-100 motion-sub ${communitySlatePillFocus}`}
                onReport={onReport ? () => onReport(post) : undefined}
              />
              {onReport ? (
                <form
                  className="inline shrink-0"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    onReport(post);
                  }}
                >
                  <button
                    type="submit"
                    className={`text-meta text-slate-400 hover:text-slate-300 motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
                  >
                    {t("community_report")}
                  </button>
                </form>
              ) : null}
            </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cyan-500/20 px-4 sm:px-5 py-4">
          {!isLoggedIn && !authPending && (
            <div className="mb-3 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 px-3 py-2 text-meta text-warning/95">
              <Link
                href="/auth/login?returnUrl=/community"
                className={`inline-flex min-h-[44px] items-center justify-center hover:underline ${communityCardLinkFocus}`}
              >
                {t("community_login_to_comment")}
              </Link>
            </div>
          )}
          <h4 className="text-meta text-slate-300 mb-3">{t("community_comments")} · {displayCommentCount}</h4>
          {commentSort != null && onCommentSortChange ? (
            <div
              role="tablist"
              aria-label={t("community_comments_sort_aria")}
              className="flex flex-wrap gap-2 mb-3"
            >
              {COMMENT_SORT_TABS.map((s) => (
                <form
                  key={s}
                  className="contents"
                  onSubmit={(e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    onCommentSortChange(s);
                  }}
                >
                  <button
                    type="submit"
                    role="tab"
                    aria-selected={commentSort === s}
                    className={`rounded-full border px-3 py-1.5 text-meta motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
                      commentSort === s
                        ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300"
                        : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40 hover:text-slate-300"
                    }`}
                  >
                    {t(`community_comments_sort_${s}`)}
                  </button>
                </form>
              ))}
            </div>
          ) : null}
          {commentsLoadError ? (
            <div className="space-y-2 py-1" role="alert" aria-live="polite">
              <ApiErrorAlert message={commentsLoadError} />
              {onRetryCommentsLoad ? (
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    onRetryCommentsLoad();
                  }}
                >
                  <button
                    type="submit"
                    aria-label={t("common_retry")}
                    className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityCyanPillFocus}`}
                  >
                    {t("common_retry")}
                  </button>
                </form>
              ) : null}
            </div>
          ) : rootComments.length === 0 ? (
            <p className="text-small text-slate-400 py-4">{t("community_no_comments")}</p>
          ) : (
            <ul className="space-y-3">
              {rootComments.map((c) => (
                <li key={c.id} className="rounded-[var(--radius-md)] border border-slate-600/50 bg-slate-800/50 p-3">
                  <div className="flex gap-2">
                    <div className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-full overflow-hidden ring-2 ring-cyan-400/30 shrink-0">
                      {c.author.avatar_url && <Image src={c.author.avatar_url} alt="" fill className="object-cover" sizes="44px" unoptimized />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <p className="text-meta text-cyan-300 font-medium">{c.author.nickname}</p>
                          {c.author.isEscrowGuide ? (
                            <span
                              className="pointer-events-none rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90"
                              aria-hidden
                            >
                              {t("community_badge_escrow_guide")}
                            </span>
                          ) : null}
                          {(c.author.role === "guide" || c.author.isEscrowGuide) && c.author.id ? (
                            <Link href={marketHrefForCommunityUser(c.author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                              {t("community_book_guide_cta")}
                            </Link>
                          ) : null}
                        </div>
                        {showReportComment(c) ? (
                          <form
                            className="contents shrink-0"
                            onSubmit={(e: FormEvent<HTMLFormElement>) => {
                              e.preventDefault();
                              onReportComment?.(c);
                            }}
                          >
                            <button
                              type="submit"
                              className={`shrink-0 text-meta text-slate-400 hover:text-slate-300 motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
                            >
                              {t("community_report")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                      {c.author.wallet ? (
                        <p className="text-meta font-mono text-slate-400 mt-0.5">{c.author.wallet}</p>
                      ) : null}
                      <p className="text-small text-slate-300 mt-0.5">{c.content}</p>
                      {getReplies(c.id).map((r) => (
                        <div key={r.id} className="mt-2 pl-2 border-l-2 border-cyan-500/30">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <p className="text-meta text-fuchsia-300 font-medium">{r.author.nickname}</p>
                              {r.author.isEscrowGuide ? (
                                <span
                                  className="pointer-events-none rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90"
                                  aria-hidden
                                >
                                  {t("community_badge_escrow_guide")}
                                </span>
                              ) : null}
                              {(r.author.role === "guide" || r.author.isEscrowGuide) && r.author.id ? (
                                <Link href={marketHrefForCommunityUser(r.author.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
                                  {t("community_book_guide_cta")}
                                </Link>
                              ) : null}
                            </div>
                            {showReportComment(r) ? (
                              <form
                                className="contents shrink-0"
                                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                                  e.preventDefault();
                                  onReportComment?.(r);
                                }}
                              >
                                <button
                                  type="submit"
                                  className={`shrink-0 text-meta text-slate-400 hover:text-slate-300 motion-sub min-h-[44px] min-w-[44px] px-1 rounded-[var(--radius-md)] inline-flex items-center justify-center ${communityShellTabFocus}`}
                                >
                                  {t("community_report")}
                                </button>
                              </form>
                            ) : null}
                          </div>
                          {r.author.wallet ? (
                            <p className="text-meta font-mono text-slate-400 mt-0.5">{r.author.wallet}</p>
                          ) : null}
                          <p className="text-small text-slate-300">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 底部输入区：固定可见，safe-area */}
      <div className="flex shrink-0 flex-col border-t border-cyan-500/30 bg-slate-900/95 p-4 safe-area-inset-b">
        {commentSendError && !commentFieldMessages?.body ? (
          <div
            id={commentSendErrorNoticeId}
            className="mb-2 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex items-center justify-between gap-2"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-meta text-warning/95">
              {commentSendErrorMessage?.trim() ? commentSendErrorMessage : t("community_comment_send_failed")}
            </p>
            {onRetryComment ? (
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryComment();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_retry")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub ${communityAmberPillFocus}`}
                >
                  {t("community_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        {commentSendError && commentFieldMessages?.body ? (
          <div
            id={commentBodyErrorNoticeId}
            className="mb-2 rounded-[var(--radius-md)] border border-danger/50 bg-danger/10 px-3 py-2 flex items-center justify-between gap-2"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-meta text-danger/95">{commentFieldMessages.body}</p>
            {onRetryComment ? (
              <form
                className="inline shrink-0"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onRetryComment();
                }}
              >
                <button
                  type="submit"
                  aria-label={t("community_retry")}
                  className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded px-3 text-meta font-medium text-danger/95 hover:bg-danger/20 motion-sub ${communityShellTabFocus}`}
                >
                  {t("community_retry")}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
        <form
          className="flex gap-2"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            id={commentComposerInputId}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (commentSendError) onRetryComment?.();
            }}
            placeholder={
              authPending
                ? t("common_loading")
                : isLoggedIn
                  ? t("community_comment_placeholder")
                  : t("community_login_to_comment")
            }
            disabled={!isLoggedIn || authPending || sending}
            aria-busy={sending || authPending ? true : undefined}
            className={
              "flex-1 min-w-0 rounded-[var(--radius-xl)] border bg-slate-800 px-4 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
              (commentFieldMessages?.body
                ? "border-danger/60 focus-visible:ring-danger/50"
                : "border-cyan-500/40 focus-visible:ring-cyan-400/50")
            }
            aria-label={t("community_comment_placeholder")}
            aria-invalid={commentSendError ?? false}
            aria-errormessage={
              commentSendError
                ? commentFieldMessages?.body
                  ? commentBodyErrorNoticeId
                  : commentSendErrorNoticeId
                : undefined
            }
          />
          <button
            type="submit"
            disabled={!isLoggedIn || authPending || sending}
            aria-busy={sending || authPending ? true : undefined}
            className={`rounded-[var(--radius-xl)] border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub min-h-[44px] inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${communityCyanPillFocus}`}
            aria-label={t("community_comment_send")}
          >
            {sending ? t("community_comment_sending") : t("community_comment_send")}
          </button>
        </form>
      </div>
    </div>
  );
}
