"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  communityVideoOverlayPortalRootClass,
  communityVideoOverlayScrimClass,
} from "@/components/market/marketStudioModalLayout";
import { communityVideoOverlayCommentDisplayCount } from "@/components/community/communityFeedMappersCounts";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";
import type { CommunityVideoOverlayProps } from "./communityVideoOverlayTypes";
import { CommunityMediaHeartBurstOverlay } from "./CommunityMediaHeartBurst";
import { CommunityVideoOverlayActionRail } from "./CommunityVideoOverlayActionRail";
import { CommunityVideoOverlayCommentSheet } from "./CommunityVideoOverlayCommentSheet";
import { CommunityVideoOverlayStage } from "./CommunityVideoOverlayStage";
import { CommunityVideoOverlayTopBar } from "./CommunityVideoOverlayTopBar";
import { useCommunityMediaTapLike } from "./useCommunityMediaTapLike";
import { useCommunityVideoOverlayController } from "./useCommunityVideoOverlayController";

export type CommunityVideoOverlayViewProps = CommunityVideoOverlayProps & {
  onActivePostChange?: (postId: string) => void;
};

export function CommunityVideoOverlayView({
  t,
  backButtonRef,
  onClose,
  items,
  isLoggedIn,
  authPending,
  likedPostIds,
  collectedPostIds,
  onLike,
  onCollect,
  commentsByPostId,
  commentsApiFetchedPostIds,
  onCommentSend,
  commentSort,
  onCommentSortChange,
  commentsLoadError,
  onRetryCommentsLoad,
  commentSendError,
  commentSendErrorMessage,
  onRetryComment,
  onActivePostChange,
  open,
  activeKey,
  postsById,
  onReport,
  authorFollowForPost,
  feedHasMore,
  feedLoadingMore,
  onRequestFeedLoadMore,
}: CommunityVideoOverlayViewProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const ctlRef = useRef<ReturnType<typeof useCommunityVideoOverlayController> | null>(null);
  const activePostIdRef = useRef("");

  const tapBridgeRef = useRef<(x: number, y: number) => void>(() => {});

  const ctl = useCommunityVideoOverlayController({
    open,
    onClose,
    items,
    activeKey,
    onVideoTap: (x, y) => tapBridgeRef.current(x, y),
    feedHasMore,
    feedLoadingMore,
    onRequestFeedLoadMore,
  });
  ctlRef.current = ctl;

  const activePostId = ctl.current?.key ?? "";
  activePostIdRef.current = activePostId;

  const liked = likedPostIds?.has(activePostId) ?? false;
  const collected = collectedPostIds?.has(activePostId) ?? false;
  const baseLikes = ctl.current?.likes ?? 0;
  const baseCollects = ctl.current?.collects ?? 0;
  const displayLikes = liked ? baseLikes + 1 : baseLikes;
  const displayCollects = collected ? baseCollects + 1 : baseCollects;
  const comments =
    activePostId && commentsByPostId ? (commentsByPostId[activePostId] ?? []) : [];
  const activePost = activePostId ? postsById?.[activePostId] : undefined;
  const commentCount = communityVideoOverlayCommentDisplayCount(activePost, comments, {
    apiFetched: Boolean(activePostId && commentsApiFetchedPostIds?.has(activePostId)),
    commentsLoadError,
  });

  const likedRef = useRef(false);
  likedRef.current = liked;

  const handleVideoLike = useCallback(() => {
    const id = activePostIdRef.current;
    if (!onLike || !id || likedRef.current) return;
    onLike(id);
  }, [onLike]);

  const { handleTap, heartBurst, reset } = useCommunityMediaTapLike({
    enabled: Boolean(onLike) && !commentsOpen,
    onLike: handleVideoLike,
    onSingleTap: () => ctlRef.current?.togglePlay(),
  });

  tapBridgeRef.current = (x, y) => handleTap(x, y, ctl.wheelAreaElRef.current);

  useEffect(() => {
    if (!activePostId) return;
    onActivePostChange?.(activePostId);
  }, [activePostId, onActivePostChange]);

  useEffect(() => {
    reset();
    setCommentsOpen(false);
  }, [activePostId, reset]);

  return (
    <div
      className={communityVideoOverlayPortalRootClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ctl.videoTitleId}
      aria-describedby={ctl.videoDescId}
      data-tt-community-video-overlay="1"
    >
      <div className={communityVideoOverlayScrimClass} aria-hidden />
      <div ref={ctl.bindOverlayStageRef} className="relative z-10 flex min-h-0 flex-1 flex-col">
        <CommunityVideoOverlayTopBar
          t={t}
          videoTitleId={ctl.videoTitleId}
          backButtonRef={backButtonRef}
          onClose={onClose}
          itemsLen={items.length}
          safeIndex={ctl.safeIndex}
          fsSupported={ctl.fsSupported}
          showNoVideo={ctl.showNoVideo}
          inFullscreen={ctl.inFullscreen}
          toggleStageFullscreen={ctl.toggleStageFullscreen}
          muted={ctl.muted}
          setMuted={ctl.setMuted}
        />

        <CommunityVideoOverlayStage
          t={t}
          videoDescId={ctl.videoDescId}
          bindWheelAreaRef={ctl.bindWheelAreaRef}
          onTouchStart={ctl.onTouchStart}
          onTouchEnd={ctl.onTouchEnd}
          itemsLen={items.length}
          safeIndex={ctl.safeIndex}
          showNoVideo={ctl.showNoVideo}
          atLast={ctl.atLast}
          videoRef={ctl.videoRef}
          current={ctl.current}
          src={ctl.src}
          poster={ctl.poster}
          muted={ctl.muted}
          paused={ctl.paused}
          togglePlay={ctl.togglePlay}
          setPaused={ctl.setPaused}
          setVideoError={ctl.setVideoError}
          onTimeUpdate={ctl.onTimeUpdate}
          onLoadedMetadata={ctl.onLoadedMetadata}
          atFirst={ctl.atFirst}
          clockCur={ctl.clockCur}
          clockDur={ctl.clockDur}
          progress={ctl.progress}
          progressTrackRef={ctl.progressTrackRef}
          onProgressPointerDown={ctl.onProgressPointerDown}
          onProgressKeyDown={ctl.onProgressKeyDown}
          slideDir={ctl.slideDir}
          commentsOpen={commentsOpen}
          buffering={ctl.buffering}
          setBuffering={ctl.setBuffering}
          chromeVisible={ctl.chromeVisible}
          showChrome={ctl.showChrome}
          onVideoPointerTap={(x, y) => handleTap(x, y, ctl.wheelAreaElRef.current)}
          mediaRetryKey={ctl.mediaRetryKey}
          onMediaRetry={ctl.retryMedia}
          hasVideoSrc={Boolean(ctl.src)}
          feedLoadingMore={ctl.feedLoadingMore && ctl.atLast}
        />

        <CommunityMediaHeartBurstOverlay burst={heartBurst} />

        {commentsOpen ? (
          <button
            type="button"
            className={TT_COMMUNITY_VIDEO_OVERLAY_L5.commentBackdrop}
            aria-label={t("community_close")}
            onClick={() => setCommentsOpen(false)}
          />
        ) : null}

        {activePostId && onLike && onCollect ? (
          <CommunityVideoOverlayActionRail
            t={t}
            postId={activePostId}
            post={postsById?.[activePostId]}
            likes={displayLikes}
            comments={commentCount}
            collects={displayCollects}
            liked={liked}
            collected={collected}
            authorAvatarUrl={ctl.current?.authorAvatarUrl}
            authorName={ctl.current?.author}
            authorId={ctl.current?.authorId}
            authorFollow={authorFollowForPost?.(activePostId)}
            onLike={() => onLike(activePostId)}
            onCollect={() => onCollect(activePostId)}
            onOpenComments={() => setCommentsOpen((v) => !v)}
            onReport={onReport}
            commentsOpen={commentsOpen}
          />
        ) : null}

        {activePostId && onCommentSend ? (
          <CommunityVideoOverlayCommentSheet
            t={t}
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            postId={activePostId}
            comments={comments}
            commentCount={commentCount}
            isLoggedIn={isLoggedIn}
            authPending={authPending}
            onSend={(content) => onCommentSend(activePostId, content)}
            commentSort={commentSort}
            onCommentSortChange={onCommentSortChange}
            commentsLoadError={commentsLoadError}
            onRetryCommentsLoad={onRetryCommentsLoad}
            commentSendError={commentSendError}
            commentSendErrorMessage={commentSendErrorMessage}
            onRetryComment={onRetryComment}
          />
        ) : null}
      </div>
    </div>
  );
}
