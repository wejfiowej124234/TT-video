"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pickCommunityFeedAutoplayPostId } from "@/components/community/pickCommunityFeedAutoplayPostId";

type CommunityFeedVideoAutoplayState = {
  activePostId: string | null;
  reducedMotion: boolean;
};

type CommunityFeedVideoAutoplayContextValue = CommunityFeedVideoAutoplayState & {
  registerViewportTarget: (postId: string, element: Element) => () => void;
};

const CommunityFeedVideoAutoplayContext =
  createContext<CommunityFeedVideoAutoplayContextValue | null>(null);

const IO_THRESHOLDS = [0, 0.25, 0.5, 0.55, 0.75, 1] as const;

export function CommunityFeedVideoAutoplayProvider({ children }: { children: ReactNode }) {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const visibilityRef = useRef<Map<string, number>>(new Map());
  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const recomputeActive = useCallback(() => {
    setActivePostId((prev) => {
      if (reducedMotionRef.current) return prev === null ? prev : null;
      const next = pickCommunityFeedAutoplayPostId(visibilityRef.current);
      return next === prev ? prev : next;
    });
  }, []);

  const recomputeActiveRef = useRef(recomputeActive);
  recomputeActiveRef.current = recomputeActive;

  const registerViewportTarget = useCallback((postId: string, element: Element) => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return () => {};
    }
    observersRef.current.get(postId)?.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visibilityRef.current.set(postId, entry.isIntersecting ? entry.intersectionRatio : 0);
        recomputeActiveRef.current();
      },
      { root: null, threshold: [...IO_THRESHOLDS] },
    );
    obs.observe(element);
    observersRef.current.set(postId, obs);

    return () => {
      obs.disconnect();
      observersRef.current.delete(postId);
      visibilityRef.current.delete(postId);
      recomputeActiveRef.current();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    recomputeActiveRef.current();
  }, [reducedMotion]);

  const value = useMemo(
    () => ({ activePostId, reducedMotion, registerViewportTarget }),
    [activePostId, reducedMotion, registerViewportTarget],
  );

  return (
    <CommunityFeedVideoAutoplayContext.Provider value={value}>
      {children}
    </CommunityFeedVideoAutoplayContext.Provider>
  );
}

export function useCommunityFeedVideoAutoplayContext() {
  return useContext(CommunityFeedVideoAutoplayContext);
}

/** 瀑布/Feed 卡片：注册视口 + 控制 `<video>` 静音 autoplay。 */
export function useCommunityFeedCardVideoAutoplay(
  postId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const ctx = useCommunityFeedVideoAutoplayContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef(ctx?.registerViewportTarget);
  registerRef.current = ctx?.registerViewportTarget;

  useEffect(() => {
    if (!enabled) return;
    const register = registerRef.current;
    const el = containerRef.current;
    if (!register || !el) return;
    return register(postId, el);
  }, [postId, enabled]);

  const activePostId = ctx?.activePostId ?? null;
  const motionReduced = ctx?.reducedMotion ?? false;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;
    const shouldPlay = activePostId === postId && !motionReduced;
    if (shouldPlay) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [activePostId, motionReduced, postId, enabled, videoRef]);

  return {
    containerRef,
    isAutoplayActive: enabled && activePostId === postId && !motionReduced,
  };
}
