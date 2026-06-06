"use client";

import { useState, useEffect, useRef, useCallback, useId, type KeyboardEvent } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  displayCollectCountFromServerAndUi,
  displayLikeCountFromServerAndUi,
  resolveCommunityPostPlayableVideoUrl,
} from "@/components/community/communityFeedMappers";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaPlaybackUrlForRender,
} from "@/lib/communityMediaClientUrl";
import { communityTopicPathForTag } from "@/lib/communityFeedSortUrl";
import { recordCommunityPostBrowse } from "@/lib/communityBrowseHistory";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import type { CommunityComment } from "@/lib/communityMockData";
import { isShowcasePostId } from "@/lib/communityShowcase";
import type { PostDetailDrawerProps } from "@/components/community/postDetailDrawerTypes";
import { resolvePostDetailImageSources } from "@/components/community/postDetailImageSources";

export function usePostDetailDrawerModel(p: PostDetailDrawerProps) {
  const {
    post,
    comments,
    commentCount,
    onClose,
    onCommentSend,
    t,
    isLoggedIn = false,
    authPending = false,
    liked,
    collected,
    onLike,
    onCollect,
    topicTagHref,
    meUserId,
    onReportComment,
  } = p;

  const topicHref =
    topicTagHref ?? ((tag: string) => communityTopicPathForTag(tag, "latest"));
  const dash = t("ui_em_dash");
  const showPostInteractions = typeof onLike === "function" && typeof onCollect === "function";
  const likedState = liked ?? false;
  const collectedState = collected ?? false;
  const displayLikes = displayLikeCountFromServerAndUi(post.likes, likedState, post.likedByMe);
  const displayCollects = displayCollectCountFromServerAndUi(
    post.collects,
    collectedState,
    post.collectedByMe,
  );
  const interactionDisabled = !isLoggedIn || authPending;
  const displayCommentCount = commentCount ?? post.comments;
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [input, setInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const [sending, setSending] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [detailVideoError, setDetailVideoError] = useState(false);
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
  const commentComposerGateId = useId();
  const [mediaRetryKey, setMediaRetryKey] = useState(0);
  const images = resolvePostDetailImageSources(post);
  const currentImageRaw = images.length > 0 ? images[carouselIndex % images.length] : "";
  const currentImage = currentImageRaw ? communityMediaAbsoluteUrlForRender(currentImageRaw) : "";
  const videoUrlRaw =
    post.is_video === true || post.type === "video"
      ? (resolveCommunityPostPlayableVideoUrl(post) ?? null)
      : null;
  const videoUrl = videoUrlRaw ? communityMediaPlaybackUrlForRender(videoUrlRaw) : null;
  const videoPosterRaw = post.cover_url?.trim() || "";
  const videoPoster = videoPosterRaw ? communityMediaAbsoluteUrlForRender(videoPosterRaw) : undefined;
  const author = post.author;
  const authorAvatarResolved =
    author?.avatar_url?.trim() ? communityMediaAbsoluteUrlForRender(author.avatar_url.trim()) : "";
  const roleKey = communityStoredRoleLabelI18nKey(author?.role);
  const authorProfileHref = author?.id ? `/community/user/${author.id}` : "/community";
  const isShowcasePost = isShowcasePostId(post.id);
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (id: string) => comments.filter((c) => c.parent_id === id);
  const showReportComment = (c: CommunityComment) =>
    Boolean(isLoggedIn && onReportComment && (!meUserId || c.author.id !== meUserId));
  const imageCarouselCount = images.length;
  const isTextOnlyDetail = post.type === "text" && images.length === 0;

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [carouselIndex]);

  useEffect(() => {
    setDetailVideoError(false);
  }, [post.id, videoUrl]);

  const browseRecordedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const id = post.id?.trim();
    if (!id) return;
    if (browseRecordedIdRef.current === id) return;
    browseRecordedIdRef.current = id;
    recordCommunityPostBrowse({
      id,
      title: post.title,
      preview: post.content?.trim().slice(0, 200),
    });
  }, [post.id, post.title, post.content]);

  useEffect(() => {
    lastDetailTapRef.current = 0;
    setShowDetailHeart(false);
    setReplyTarget(null);
    setCarouselIndex(0);
    setImageError(false);
  }, [post.id]);

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

  const handleDetailCarouselKeyDown = (e: KeyboardEvent) => {
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

  const composerInputDisabled = isShowcasePost
    ? authPending || sending
    : !isLoggedIn || authPending || sending;
  const sendDisabled = composerInputDisabled || !input.trim();

  const handleSend = async () => {
    if (isShowcasePost) {
      if (authPending || sending) return;
    } else if (!isLoggedIn || authPending || sending) {
      return;
    }
    const v = input.trim();
    if (!v) return;
    setSending(true);
    const payload = v;
    const parentId = replyTarget?.id;
    setInput("");
    try {
      await Promise.resolve(onCommentSend(payload, parentId));
      setReplyTarget(null);
    } catch (err) {
      if (typeof window !== "undefined") {
        console.error("PostDetailDrawer handleSend:", err);
      }
      setInput(payload);
    } finally {
      setSending(false);
    }
  };

  return {
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
    roleKey,
    authorProfileHref,
    rootComments,
    getReplies,
    showReportComment,
    imageCarouselCount,
    isTextOnlyDetail,
    handleDetailDoubleTapLike,
    handleDetailCarouselKeyDown,
    composerInputDisabled,
    sendDisabled,
    isShowcasePost,
    handleSend,
    mediaRetryKey,
    retryMedia: () => {
      setImageError(false);
      setDetailVideoError(false);
      setMediaRetryKey((k) => k + 1);
    },
  };
}
