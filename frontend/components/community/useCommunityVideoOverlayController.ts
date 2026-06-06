"use client";

import {
  useState,
  useEffect,
  useId,
  useRef,
  useCallback,
  type MutableRefObject,
} from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaPlaybackUrlForRender,
} from "@/lib/communityMediaClientUrl";
import type { CommunityVideoOverlayProps } from "./communityVideoOverlayTypes";
import { useCommunityVideoOverlayFullscreenStage } from "./useCommunityVideoOverlayFullscreenStage";
import { useCommunityVideoOverlayGlobalShortcuts } from "./useCommunityVideoOverlayGlobalShortcuts";
import { useCommunityVideoOverlayNavInteractions } from "./useCommunityVideoOverlayNavInteractions";
import { useCommunityVideoOverlayPlaybackControls } from "./useCommunityVideoOverlayPlaybackControls";

export type { CommunityVideoOverlayController } from "./communityVideoOverlayControllerTypes";

export function useCommunityVideoOverlayController({
  open,
  onClose,
  items,
  activeKey,
  onVideoTap,
  feedHasMore = false,
  feedLoadingMore = false,
  onRequestFeedLoadMore,
}: Pick<
  CommunityVideoOverlayProps,
  "open" | "onClose" | "items" | "activeKey" | "feedHasMore" | "feedLoadingMore" | "onRequestFeedLoadMore"
> & {
  onVideoTap?: (clientX: number, clientY: number) => void;
}) {
  const videoTitleId = useId();
  const videoDescId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayStageRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(open, onClose);
  const bindOverlayStageRef = useCallback(
    (el: HTMLDivElement | null) => {
      (focusTrapRef as MutableRefObject<HTMLDivElement | null>).current = el;
      overlayStageRef.current = el;
    },
    [focusTrapRef],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clockCur, setClockCur] = useState(0);
  const [clockDur, setClockDur] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1 | 0>(0);
  const [buffering, setBuffering] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAreaElRef = useRef<HTMLDivElement | null>(null);

  const [mediaRetryKey, setMediaRetryKey] = useState(0);
  const pendingFeedLoadRef = useRef(false);
  const itemsLenPrevRef = useRef(items.length);
  const safeIndex = items.length > 0 ? Math.min(Math.max(0, index), items.length - 1) : 0;
  const current = items[safeIndex];
  const rawVideo = current?.videoUrl?.trim() ?? "";
  const src = rawVideo
    ? rawVideo.startsWith("blob:") || rawVideo.startsWith("http://") || rawVideo.startsWith("https://")
      ? rawVideo
      : communityMediaPlaybackUrlForRender(rawVideo)
    : "";
  const posterRaw = current?.posterUrl?.trim() || "";
  const posterResolved = posterRaw ? communityMediaAbsoluteUrlForRender(posterRaw) : "";
  const poster = posterResolved || undefined;

  const atFirst = safeIndex <= 0;
  const atLast = items.length > 0 && safeIndex >= items.length - 1;
  const showNoVideo = !src || videoError;

  const retryMedia = useCallback(() => {
    setVideoError(false);
    setBuffering(true);
    setProgress(0);
    setClockCur(0);
    setMediaRetryKey((k) => k + 1);
  }, []);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
    chromeHideTimerRef.current = setTimeout(() => setChromeVisible(false), 3200);
  }, []);

  const handleVideoTap = useCallback(
    (clientX: number, clientY: number) => {
      showChrome();
      onVideoTap?.(clientX, clientY);
    },
    [onVideoTap, showChrome],
  );

  const onAtLastAdvance = useCallback(() => {
    if (!feedHasMore || feedLoadingMore) return;
    pendingFeedLoadRef.current = true;
    onRequestFeedLoadMore?.();
  }, [feedHasMore, feedLoadingMore, onRequestFeedLoadMore]);

  const { wheelAreaRef, goNext, goPrev, onTouchStart, onTouchEnd } = useCommunityVideoOverlayNavInteractions({
    open,
    itemsLength: items.length,
    atFirst,
    onClose,
    setIndex,
    setPaused,
    setVideoError,
    setProgress,
    setSlideDir,
    onTap: onVideoTap ? handleVideoTap : undefined,
    onAtLastAdvance,
  });

  const bindWheelAreaRef = useCallback(
    (el: HTMLDivElement | null) => {
      wheelAreaRef.current = el;
      wheelAreaElRef.current = el;
    },
    [wheelAreaRef],
  );

  const { inFullscreen, toggleStageFullscreen, fsSupported } =
    useCommunityVideoOverlayFullscreenStage(overlayStageRef);

  const { togglePlay, onTimeUpdate, onLoadedMetadata, onProgressPointerDown, onProgressKeyDown } =
    useCommunityVideoOverlayPlaybackControls({
      videoRef,
      progressTrackRef,
      setProgress,
      setClockCur,
      setClockDur,
      setPaused,
    });

  useEffect(() => {
    if (!open) {
      pendingFeedLoadRef.current = false;
      itemsLenPrevRef.current = items.length;
      return;
    }
    const prevLen = itemsLenPrevRef.current;
    itemsLenPrevRef.current = items.length;
    if (!pendingFeedLoadRef.current || items.length <= prevLen) return;
    pendingFeedLoadRef.current = false;
    setSlideDir(1);
    setIndex((i) => Math.min(i + 1, items.length - 1));
    setPaused(false);
    setVideoError(false);
    setProgress(0);
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const i = activeKey ? items.findIndex((x) => x.key === activeKey) : 0;
    setIndex(i >= 0 ? i : 0);
    setSlideDir(0);
    setPaused(false);
    setMuted(true);
    setVideoError(false);
    setProgress(0);
    setClockCur(0);
    setClockDur(0);
    setBuffering(true);
    setChromeVisible(true);
    setMediaRetryKey(0);
  }, [open, activeKey]);

  useEffect(() => {
    if (!open || paused) {
      setChromeVisible(true);
      if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
      return;
    }
    showChrome();
    return () => {
      if (chromeHideTimerRef.current) clearTimeout(chromeHideTimerRef.current);
    };
  }, [open, paused, safeIndex, showChrome]);

  useEffect(() => {
    if (!open || !src) return;
    setVideoError(false);
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
  }, [open, src, muted]);

  useEffect(() => {
    if (!open || !src) return;
    const el = videoRef.current;
    if (!el) return;
    const p = el.play();
    void p?.then(() => setPaused(false)).catch(() => setPaused(true));
  }, [open, src, safeIndex]);

  useCommunityVideoOverlayGlobalShortcuts({
    open,
    goNext,
    goPrev,
    togglePlay,
    setMuted,
    fullscreenShortcutEnabled: fsSupported && !showNoVideo,
    toggleStageFullscreen,
  });

  return {
    videoTitleId,
    videoDescId,
    videoRef,
    bindOverlayStageRef,
    wheelAreaRef,
    progressTrackRef,
    safeIndex,
    current,
    src,
    poster,
    paused,
    muted,
    videoError,
    progress,
    clockCur,
    clockDur,
    slideDir,
    buffering,
    setBuffering,
    chromeVisible,
    showChrome,
    wheelAreaElRef,
    bindWheelAreaRef,
    inFullscreen,
    atFirst,
    atLast,
    showNoVideo,
    fsSupported,
    onTouchStart,
    onTouchEnd,
    goNext,
    goPrev,
    togglePlay,
    toggleStageFullscreen,
    setMuted,
    setPaused,
    setVideoError,
    onTimeUpdate,
    onLoadedMetadata,
    onProgressPointerDown,
    onProgressKeyDown,
    onClose,
    mediaRetryKey,
    retryMedia,
    feedLoadingMore,
    feedHasMore,
  };
}
