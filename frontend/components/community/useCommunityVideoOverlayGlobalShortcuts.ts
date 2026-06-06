"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type Args = {
  open: boolean;
  goNext: () => void;
  goPrev: () => void;
  togglePlay: () => void;
  setMuted: Dispatch<SetStateAction<boolean>>;
  /** When false, skip **`f`** fullscreen shortcut (no playable src / load error). */
  fullscreenShortcutEnabled?: boolean;
  toggleStageFullscreen?: () => void;
};

export function useCommunityVideoOverlayGlobalShortcuts({
  open,
  goNext,
  goPrev,
  togglePlay,
  setMuted,
  fullscreenShortcutEnabled = false,
  toggleStageFullscreen,
}: Args) {
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: globalThis.KeyboardEvent) => {
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        goNext();
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        goPrev();
      } else if (ev.key === " " || ev.key === "Spacebar") {
        ev.preventDefault();
        togglePlay();
      } else if (ev.key === "m" || ev.key === "M") {
        setMuted((m) => !m);
      } else if (
        (ev.key === "f" || ev.key === "F") &&
        fullscreenShortcutEnabled &&
        toggleStageFullscreen
      ) {
        const t = ev.target;
        if (t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        ev.preventDefault();
        toggleStageFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    open,
    goNext,
    goPrev,
    togglePlay,
    setMuted,
    fullscreenShortcutEnabled,
    toggleStageFullscreen,
  ]);
}
