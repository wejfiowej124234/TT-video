"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

type Args = {
  videoRef: RefObject<HTMLVideoElement | null>;
  progressTrackRef: RefObject<HTMLDivElement | null>;
  setProgress: Dispatch<SetStateAction<number>>;
  setClockCur: Dispatch<SetStateAction<number>>;
  setClockDur: Dispatch<SetStateAction<number>>;
  setPaused: Dispatch<SetStateAction<boolean>>;
};

export function useCommunityVideoOverlayPlaybackControls({
  videoRef,
  progressTrackRef,
  setProgress,
  setClockCur,
  setClockDur,
  setPaused,
}: Args) {
  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      el.pause();
      setPaused(true);
    }
  }, [videoRef, setPaused]);

  const onTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(Math.min(100, (100 * el.currentTime) / el.duration));
    setClockCur(el.currentTime);
    setClockDur(el.duration);
  }, [videoRef, setProgress, setClockCur, setClockDur]);

  const onLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    setClockDur(el.duration);
    setClockCur(el.currentTime);
  }, [videoRef, setClockDur, setClockCur]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = progressTrackRef.current;
      const el = videoRef.current;
      if (!track || !el?.duration) return;
      const r = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
      el.currentTime = ratio * el.duration;
      setProgress(ratio * 100);
      setClockCur(el.currentTime);
    },
    [videoRef, progressTrackRef, setProgress, setClockCur],
  );

  const onProgressPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      seekFromClientX(e.clientX);
      const track = progressTrackRef.current;
      if (!track) return;
      const move = (ev: globalThis.PointerEvent) => seekFromClientX(ev.clientX);
      const up = () => {
        track.removeEventListener("pointermove", move);
        track.removeEventListener("pointerup", up);
        track.removeEventListener("pointercancel", up);
      };
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        /* older engines */
      }
      track.addEventListener("pointermove", move);
      track.addEventListener("pointerup", up);
      track.addEventListener("pointercancel", up);
    },
    [seekFromClientX, progressTrackRef],
  );

  const onProgressKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const el = videoRef.current;
      if (!el?.duration) return;
      const step = Math.max(5, el.duration * 0.05);
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        el.currentTime = Math.max(0, el.currentTime - step);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        el.currentTime = Math.min(el.duration, el.currentTime + step);
      } else if (e.key === "Home") {
        e.preventDefault();
        el.currentTime = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        el.currentTime = el.duration;
      } else {
        return;
      }
      setProgress((100 * el.currentTime) / el.duration);
      setClockCur(el.currentTime);
    },
    [videoRef, setProgress, setClockCur],
  );

  return {
    togglePlay,
    onTimeUpdate,
    onLoadedMetadata,
    onProgressPointerDown,
    onProgressKeyDown,
  };
}
