"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { TT_COMMUNITY_VIDEO_OVERLAY_L5 } from "@/lib/marketingUi";

export type CommunityVideoOverlayTopBarProps = {
  t: (key: string) => string;
  videoTitleId: string;
  backButtonRef?: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  itemsLen: number;
  safeIndex: number;
  fsSupported: boolean;
  showNoVideo: boolean;
  inFullscreen: boolean;
  toggleStageFullscreen: () => void;
  muted: boolean;
  setMuted: Dispatch<SetStateAction<boolean>>;
};

export function CommunityVideoOverlayTopBar({
  t,
  videoTitleId,
  backButtonRef,
  onClose,
  itemsLen,
  safeIndex,
  fsSupported,
  showNoVideo,
  inFullscreen,
  toggleStageFullscreen,
  muted,
  setMuted,
}: CommunityVideoOverlayTopBarProps) {
  const title =
    itemsLen > 1
      ? t("community_video_feed_position")
          .replace("{{current}}", String(safeIndex + 1))
          .replace("{{total}}", String(itemsLen))
      : t("community_video_playing");

  return (
    <div className={TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayTopBar}>
      <form
        className="contents"
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <button
          ref={backButtonRef as RefObject<HTMLButtonElement> | undefined}
          type="submit"
          className={TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCloseFab}
          aria-label={t("community_back_drawer")}
        >
          <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </form>

      <span
        id={videoTitleId}
        className="pointer-events-none absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] max-w-[42%] -translate-x-1/2 truncate pt-2.5 text-meta font-medium tabular-nums text-white/90"
      >
        {title}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {fsSupported && !showNoVideo ? (
          <button
            type="button"
            onClick={toggleStageFullscreen}
            className={TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCloseFab}
            aria-label={inFullscreen ? t("community_video_exit_fullscreen") : t("community_video_enter_fullscreen")}
            aria-pressed={inFullscreen}
          >
            {inFullscreen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className={TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCloseFab}
          aria-label={muted ? t("community_video_unmute") : t("community_video_mute")}
          aria-pressed={!muted}
        >
          {muted ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            type="submit"
            className={TT_COMMUNITY_VIDEO_OVERLAY_L5.overlayCloseFab}
            aria-label={t("community_close")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
