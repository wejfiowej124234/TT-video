"use client";

import { useEffect, useRef, useState, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { useCommunityDrawerComposerKeyboardInset } from "@/components/community/useCommunityDrawerComposerKeyboardInset";
import { PostDetailDrawerHeader } from "@/components/community/PostDetailDrawerHeader";
import { PostDetailDrawerMediaZone } from "@/components/community/PostDetailDrawerMediaZone";
import { PostDetailImageLightbox } from "@/components/community/PostDetailImageLightbox";
import { PostDetailTextNoteHero } from "@/components/community/PostDetailTextNoteHero";
import { PostDetailDrawerMetaSection } from "@/components/community/PostDetailDrawerMetaSection";
import { PostDetailDrawerActionBar } from "@/components/community/PostDetailDrawerActionBar";
import { PostDetailDrawerCommentsSection } from "@/components/community/PostDetailDrawerCommentsSection";
import { PostDetailDrawerFooterComposer } from "@/components/community/PostDetailDrawerFooterComposer";
import { usePostDetailDrawerModel } from "@/components/community/usePostDetailDrawerModel";
import type { PostDetailDrawerProps } from "@/components/community/postDetailDrawerTypes";
import { communitySlatePillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { resolveDetailVideoFeedNavigate } from "@/components/community/postDetailVideoFeedNav";
import { isShowcasePostId } from "@/lib/communityShowcase";

/** 31 附录 · 小红书式帖详情：左媒体 Hero + 右侧作者/互动/评论 */
export function PostDetailDrawer(props: PostDetailDrawerProps) {
  const {
    post,
    comments,
    onClose,
    onCommentSend,
    t,
    isLoggedIn = false,
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
    focusCommentsOnMount = false,
    commentsHasMore,
    onLoadMoreComments,
    commentsLoadMoreBusy,
    videoFeedPostIds,
    onVideoFeedSelect,
    onVideoFeedLoadMore,
    videoFeedLoadingMore,
  } = props;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const handleDrawerClose = useCallback(() => {
    if (lightboxOpen) {
      setLightboxOpen(false);
      return;
    }
    onClose();
  }, [lightboxOpen, onClose]);

  const model = usePostDetailDrawerModel({ ...props, onClose: handleDrawerClose });
  const {
    topicHref,
    dash,
    showPostInteractions,
    likedState,
    collectedState,
    displayLikes,
    displayCollects,
    interactionDisabled,
    displayCommentCount,
    carouselIndex,
    setCarouselIndex,
    input,
    setInput,
    replyTarget,
    setReplyTarget,
    sending,
    imageError,
    setImageError,
    detailVideoError,
    setDetailVideoError,
    showDetailHeart,
    backButtonRef,
    carouselTouchStartX,
    containerRef,
    drawerTitleId,
    drawerDescId,
    postVisibilitySelectId,
    commentSendErrorNoticeId,
    commentBodyErrorNoticeId,
    commentComposerInputId,
    commentComposerGateId,
    images,
    currentImage,
    videoUrl,
    videoPoster,
    author,
    authorAvatarResolved,
    identityKeys,
    authorProfileHref,
    rootComments,
    getReplies,
    showReportComment,
    showDeleteComment,
    showReplyToComment,
    isCommentByPostAuthor,
    isTextOnlyDetail,
    handleDetailDoubleTapLike,
    handleDetailCarouselKeyDown,
    composerInputDisabled,
    sendDisabled,
    handleSend,
    mediaRetryKey,
    retryMedia,
  } = model;

  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const composerBarRef = useRef<HTMLDivElement>(null);
  useCommunityDrawerComposerKeyboardInset(composerBarRef);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, [backButtonRef]);

  useEffect(() => {
    if (!focusCommentsOnMount) return;
    const el = commentsSectionRef.current;
    if (!el) return;
    const tId = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
    return () => window.clearTimeout(tId);
  }, [focusCommentsOnMount, post.id]);

  useEffect(() => {
    setLightboxOpen(false);
  }, [post.id]);

  const lightboxSources = images;

  const videoFeedIndex =
    videoFeedPostIds && videoFeedPostIds.length > 0
      ? videoFeedPostIds.indexOf(post.id)
      : -1;
  const showVideoFeedNav = Boolean(videoFeedPostIds && videoFeedPostIds.length > 1);

  const handleVideoFeedPrev = useCallback(() => {
    if (!videoFeedPostIds?.length || !onVideoFeedSelect) return;
    const { nextPostId } = resolveDetailVideoFeedNavigate(videoFeedPostIds, post.id, "prev");
    if (nextPostId) onVideoFeedSelect(nextPostId);
  }, [videoFeedPostIds, onVideoFeedSelect, post.id]);

  const handleVideoFeedNext = useCallback(() => {
    if (!videoFeedPostIds?.length) return;
    const { nextPostId, atLastShouldLoadMore } = resolveDetailVideoFeedNavigate(
      videoFeedPostIds,
      post.id,
      "next",
    );
    if (nextPostId && onVideoFeedSelect) {
      onVideoFeedSelect(nextPostId);
      return;
    }
    if (atLastShouldLoadMore) onVideoFeedLoadMore?.();
  }, [videoFeedPostIds, onVideoFeedSelect, onVideoFeedLoadMore, post.id]);

  const handleDetailMediaKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showVideoFeedNav) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleVideoFeedNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleVideoFeedPrev();
      }
    },
    [showVideoFeedNav, handleVideoFeedNext, handleVideoFeedPrev],
  );

  return (
    <div
      ref={containerRef}
      data-tt-community-post-detail-drawer="1"
      data-tt-community-post-detail-showcase={isShowcasePostId(post.id) ? "1" : undefined}
      data-post-id={post.id}
      className={TT_COMMUNITY_DRAWER_L5.postDetailOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerTitleId}
      aria-describedby={drawerDescId}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDrawerClose();
      }}
    >
      <div className={TT_COMMUNITY_DRAWER_L5.postDetailShell} onClick={(e) => e.stopPropagation()}>
        <div className={TT_COMMUNITY_DRAWER_L5.postDetailMobileHandle} aria-hidden />

        {onDeletePost || onPostVisibilityChange ? (
          <PostDetailDrawerHeader
            backButtonRef={backButtonRef}
            drawerTitleId={drawerTitleId}
            post={post}
            t={t}
            onClose={handleDrawerClose}
            onDeletePost={onDeletePost}
            deletePostBusy={deletePostBusy}
            onPostVisibilityChange={onPostVisibilityChange}
            postVisibilityBusy={postVisibilityBusy}
            postVisibilitySelectId={postVisibilitySelectId}
          />
        ) : null}

        <p id={drawerDescId} className="sr-only">
          {t("community_view_full")}
        </p>
        <h2 id={drawerTitleId} className="sr-only">
          {post.title || t("community_type_" + post.type)}
        </h2>

        <div className={TT_COMMUNITY_DRAWER_L5.postDetailBodySplit}>
          <div className={TT_COMMUNITY_DRAWER_L5.postDetailMediaColumn}>
            {!isTextOnlyDetail ? (
              <form
                className="contents md:hidden"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  handleDrawerClose();
                }}
              >
                <button
                  ref={closeButtonRef}
                  type="submit"
                  className={`${TT_COMMUNITY_DRAWER_L5.postDetailMediaCloseFab} ${communitySlatePillFocus}`}
                  aria-label={t("community_back_drawer")}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            ) : null}
            {isTextOnlyDetail ? (
              <PostDetailTextNoteHero
                post={post}
                t={t}
                topicHref={topicHref}
                onAfterTopicTagClick={onAfterTopicTagClick}
              />
            ) : (
              <PostDetailDrawerMediaZone
                post={post}
                t={t}
                isTextOnlyDetail={isTextOnlyDetail}
                handleDetailDoubleTapLike={handleDetailDoubleTapLike}
                showDetailHeart={showDetailHeart}
                showPostInteractions={showPostInteractions}
                videoUrl={videoUrl}
                detailVideoError={detailVideoError}
                setDetailVideoError={setDetailVideoError}
                videoPoster={videoPoster}
                images={images}
                carouselIndex={carouselIndex}
                setCarouselIndex={setCarouselIndex}
                handleDetailCarouselKeyDown={handleDetailCarouselKeyDown}
                handleDetailMediaKeyDown={handleDetailMediaKeyDown}
                imageError={imageError}
                setImageError={setImageError}
                currentImage={currentImage}
                carouselTouchStartX={carouselTouchStartX}
                onImageOpen={() => setLightboxOpen(true)}
                mediaRetryKey={mediaRetryKey}
                onMediaRetry={retryMedia}
                videoFeedIndex={videoFeedIndex}
                videoFeedTotal={videoFeedPostIds?.length ?? 0}
                showVideoFeedNav={showVideoFeedNav}
                onVideoFeedPrev={handleVideoFeedPrev}
                onVideoFeedNext={handleVideoFeedNext}
                videoFeedLoadingMore={videoFeedLoadingMore}
              />
            )}
          </div>

          <div className={TT_COMMUNITY_DRAWER_L5.postDetailSideColumn}>
            <div className={TT_COMMUNITY_DRAWER_L5.postDetailSideMetaBlock}>
              <PostDetailDrawerMetaSection
                post={post}
                t={t}
                dash={dash}
                isTextOnlyDetail={isTextOnlyDetail}
                author={author}
                authorAvatarResolved={authorAvatarResolved}
                identityKeys={identityKeys}
                authorProfileHref={authorProfileHref}
                authorFollow={authorFollow}
                topicHref={topicHref}
                onAfterTopicTagClick={onAfterTopicTagClick}
                onClose={handleDrawerClose}
              />

              <PostDetailDrawerActionBar
                t={t}
                post={post}
                showPostInteractions={showPostInteractions}
                interactionDisabled={interactionDisabled}
                likedState={likedState}
                collectedState={collectedState}
                displayLikes={displayLikes}
                displayCollects={displayCollects}
                displayCommentCount={displayCommentCount}
                onLike={onLike}
                onCollect={onCollect}
                onFocusComments={() => commentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                onReport={onReport}
              />
            </div>

            <div ref={commentsSectionRef} className={TT_COMMUNITY_DRAWER_L5.postDetailSideScroll}>
              <PostDetailDrawerCommentsSection
                  t={t}
                  isLoggedIn={isLoggedIn}
                  authPending={authPending}
                  displayCommentCount={displayCommentCount}
                  commentSort={commentSort}
                  onCommentSortChange={onCommentSortChange}
                  commentsLoadError={commentsLoadError}
                  onRetryCommentsLoad={onRetryCommentsLoad}
                  rootComments={rootComments}
                  getReplies={getReplies}
                  canCommentReply={isLoggedIn && !authPending}
                  showReplyToComment={showReplyToComment}
                  setReplyTarget={setReplyTarget}
                  showReportComment={showReportComment}
                  onReportComment={onReportComment}
                  showDeleteComment={showDeleteComment}
                  onDeleteComment={props.onDeleteComment}
                  isCommentByPostAuthor={isCommentByPostAuthor}
                  postAuthor={author}
                  commentsHasMore={commentsHasMore}
                  onLoadMoreComments={onLoadMoreComments}
                  commentsLoadMoreBusy={commentsLoadMoreBusy}
                  isShowcasePost={isShowcasePostId(post.id)}
                  postId={post.id}
              />
            </div>

            <div ref={composerBarRef} className="relative z-10 shrink-0">
              <PostDetailDrawerFooterComposer
                t={t}
                isLoggedIn={isLoggedIn}
                authPending={authPending}
                sending={sending}
                input={input}
                setInput={setInput}
                composerInputDisabled={composerInputDisabled}
                sendDisabled={sendDisabled}
                handleSend={handleSend}
                replyTarget={replyTarget}
                setReplyTarget={setReplyTarget}
                commentSendError={commentSendError}
                commentSendErrorMessage={commentSendErrorMessage}
                commentFieldMessages={commentFieldMessages}
                onRetryComment={onRetryComment}
                commentSendErrorNoticeId={commentSendErrorNoticeId}
                commentBodyErrorNoticeId={commentBodyErrorNoticeId}
                commentComposerInputId={commentComposerInputId}
                commentComposerGateId={commentComposerGateId}
                isShowcasePost={isShowcasePostId(post.id)}
              />
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && lightboxSources.length > 0 ? (
        <PostDetailImageLightbox
          sources={lightboxSources}
          initialIndex={carouselIndex}
          alt={(post.title || post.content || "").slice(0, 30)}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setCarouselIndex}
          t={t}
        />
      ) : null}
    </div>
  );
}
