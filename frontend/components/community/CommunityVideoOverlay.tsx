"use client";

import { useState, useEffect, useId } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export interface CommunityVideoOverlayProps {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
  backButtonRef?: React.RefObject<HTMLButtonElement | null>;
  /** 51-31-21：真实 video_url；无则用示例流或显示无视频提示 */
  videoUrl?: string | null;
  /** 与帖子 `cover_url` 一致，全屏播放前展示封面 */
  posterUrl?: string | null;
}

/** P0 视频全屏播放浮层。51-31-13/51-31-21：焦点 trap、Esc、真实 videoUrl、无视频友好提示。 */
export default function CommunityVideoOverlay({ open, onClose, t, backButtonRef, videoUrl, posterUrl }: CommunityVideoOverlayProps) {
  const videoTitleId = useId();
  const videoDescId = useId();
  const focusTrapRef = useFocusTrap(open, onClose);
  const [videoError, setVideoError] = useState(false);
  const poster = posterUrl?.trim() || undefined;
  useEffect(() => {
    if (open) setVideoError(false);
  }, [open, videoUrl, poster]);
  const src = videoUrl && videoUrl.trim() ? videoUrl : SAMPLE_VIDEO_URL;
  const useSample = !videoUrl || !videoUrl.trim();
  const showNoVideo = videoError || (open && videoUrl !== undefined && !videoUrl?.trim());
  if (!open) return null;
  return (
    <div
      ref={focusTrapRef}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={videoTitleId}
      aria-describedby={videoDescId}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 safe-area-inset-t bg-black/60 min-h-[48px]">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <button
            ref={backButtonRef as React.RefObject<HTMLButtonElement> | undefined}
            type="submit"
            className="flex min-h-[44px] items-center justify-start gap-2 rounded-[var(--radius-md)] border border-white/20 bg-black/50 px-3 py-2 text-meta text-white/90 hover:bg-white/10 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label={t("community_back_drawer")}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t("community_back_drawer")}</span>
          </button>
        </form>
        <span id={videoTitleId} className="text-meta text-white/70">
          {useSample ? t("community_video_placeholder") : t("community_video_playing")}
        </span>
        <div className="w-20" aria-hidden />
      </div>

      <p id={videoDescId} className="sr-only">{t("community_subtitle")}</p>

      <div className="flex-1 flex items-center justify-center min-h-0 p-4">
        <div className="relative w-full max-w-2xl aspect-video rounded-[var(--radius-md)] border border-cyan-500/40 bg-black overflow-hidden">
          {showNoVideo ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-small" role="status" aria-live="polite">
              {t("community_video_no_source")}
            </div>
          ) : (
            <video
              key={src}
              src={src}
              poster={poster}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
              aria-label={useSample ? t("community_video_placeholder") : t("community_video_playing")}
              onError={() => setVideoError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
