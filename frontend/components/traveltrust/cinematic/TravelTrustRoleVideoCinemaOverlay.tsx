"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TT_L5_MOTION_EASE, TT_ROLE_VIDEO_L5 } from "@/lib/traveltrust/l5";

export type TravelTrustRoleVideoCinemaCloseReason = "ended" | "user";

type Props = {
  open: boolean;
  roleLabel: string;
  mp4Src: string;
  webmSrc?: string;
  posterSrc?: string;
  reduceMotion: boolean | null;
  onClose: (reason: TravelTrustRoleVideoCinemaCloseReason) => void;
  closeLabel: string;
  dismissHint: string;
  regionLabel: string;
  playLabel: string;
  pauseLabel: string;
  muteLabel: string;
  unmuteLabel: string;
};

function formatCinemaTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 角色剧场 · cinematic 层（RC 视觉收尾）：
 * 16:9 cover · 暖色自研底栏 · 暖边框阴影 · 提示上移。
 * 交互不变：点播打开 · Esc/遮罩/✕ 关 · 播完自动返回。无原生 controls / 无 morph。
 */
export function TravelTrustRoleVideoCinemaOverlay({
  open,
  roleLabel,
  mp4Src,
  webmSrc,
  posterSrc,
  reduceMotion,
  onClose,
  closeLabel,
  dismissHint,
  regionLabel,
  playLabel,
  pauseLabel,
  muteLabel,
  unmuteLabel,
}: Props) {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const requestClose = useCallback(
    (reason: TravelTrustRoleVideoCinemaCloseReason) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const el = videoRef.current;
      if (el) el.pause();
      onClose(reason);
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      closingRef.current = false;
      setPlaying(false);
      setMuted(false);
      setCurrent(0);
      setDuration(0);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose("user");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (!open) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setMuted(false);
    el.currentTime = 0;
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [open, mp4Src]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const onSeek = useCallback((value: number) => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(value)) return;
    el.currentTime = value;
    setCurrent(value);
  }, []);

  if (typeof document === "undefined") return null;

  const instant = Boolean(reduceMotion);

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        closingRef.current = false;
      }}
    >
      {open ? (
        <motion.div
          key="tt-role-video-cinema"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-label={regionLabel}
          data-tt-traveltrust-role-video-cinema="1"
          data-tt-traveltrust-role-video-cinema-l5="1"
          data-tt-traveltrust-role-video-cinema-cover="1"
          data-tt-traveltrust-role-video-cinema-chrome="warm-l5"
          className={TT_ROLE_VIDEO_L5.cinemaPortalClass}
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={instant ? undefined : { opacity: 0 }}
          transition={{
            duration: instant ? 0 : TT_ROLE_VIDEO_L5.cinemaScrimEnterDuration,
            ease: TT_L5_MOTION_EASE,
          }}
        >
          <motion.button
            type="button"
            aria-label={closeLabel}
            className={TT_ROLE_VIDEO_L5.cinemaScrimClass}
            data-tt-traveltrust-role-video-cinema-scrim="1"
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={instant ? undefined : { opacity: 0 }}
            transition={{ duration: instant ? 0 : TT_ROLE_VIDEO_L5.cinemaScrimEnterDuration }}
            onClick={() => requestClose("user")}
          />
          <motion.div
            className={TT_ROLE_VIDEO_L5.cinemaStageClass}
            data-tt-traveltrust-role-video-cinema-stage="1"
            initial={instant ? false : { ...TT_ROLE_VIDEO_L5.cinemaStageInitial }}
            animate={{ ...TT_ROLE_VIDEO_L5.cinemaStageAnimate }}
            exit={
              instant
                ? undefined
                : {
                    ...TT_ROLE_VIDEO_L5.cinemaStageExit,
                    transition: {
                      duration: TT_ROLE_VIDEO_L5.cinemaExitDuration,
                      ease: TT_L5_MOTION_EASE,
                    },
                  }
            }
            transition={{
              duration: instant ? 0 : TT_ROLE_VIDEO_L5.cinemaEnterDuration,
              ease: TT_L5_MOTION_EASE,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={TT_ROLE_VIDEO_L5.cinemaFrameClass}>
              <div className={TT_ROLE_VIDEO_L5.cinemaTopBarClass}>
                <div className={TT_ROLE_VIDEO_L5.cinemaTopMetaClass}>
                  <p
                    id={titleId}
                    className={TT_ROLE_VIDEO_L5.cinemaTitleClass}
                    data-tt-traveltrust-role-video-cinema-title="1"
                  >
                    {roleLabel}
                  </p>
                  <p
                    className={TT_ROLE_VIDEO_L5.cinemaHintClass}
                    data-tt-traveltrust-role-video-cinema-hint="1"
                  >
                    {dismissHint}
                  </p>
                </div>
                <button
                  type="button"
                  className={TT_ROLE_VIDEO_L5.cinemaCloseClass}
                  aria-label={closeLabel}
                  data-tt-traveltrust-role-video-cinema-close="1"
                  onClick={() => requestClose("user")}
                >
                  <span aria-hidden className={TT_ROLE_VIDEO_L5.cinemaCloseGlyphClass}>
                    ✕
                  </span>
                </button>
              </div>

              <video
                ref={videoRef}
                className={TT_ROLE_VIDEO_L5.cinemaVideoClass}
                playsInline
                poster={posterSrc || undefined}
                aria-label={regionLabel}
                data-tt-traveltrust-role-video-cinema-player="1"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  setCurrent(el.currentTime);
                }}
                onLoadedMetadata={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  setDuration(Number.isFinite(el.duration) ? el.duration : 0);
                }}
                onEnded={() => requestClose("ended")}
              >
                {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
                <source src={mp4Src} type="video/mp4" />
              </video>

              <div
                className={TT_ROLE_VIDEO_L5.cinemaChromeClass}
                data-tt-traveltrust-role-video-cinema-chrome-bar="1"
              >
                <input
                  type="range"
                  min={0}
                  max={duration > 0 ? duration : 0}
                  step={0.05}
                  value={Math.min(current, duration || 0)}
                  aria-label={regionLabel}
                  className={TT_ROLE_VIDEO_L5.cinemaProgressClass}
                  data-tt-traveltrust-role-video-cinema-progress="1"
                  onChange={(e) => onSeek(Number(e.target.value))}
                />
                <div className={TT_ROLE_VIDEO_L5.cinemaChromeRowClass}>
                  <button
                    type="button"
                    className={TT_ROLE_VIDEO_L5.cinemaChromeBtnClass}
                    aria-label={playing ? pauseLabel : playLabel}
                    data-tt-traveltrust-role-video-cinema-play-toggle="1"
                    onClick={togglePlay}
                  >
                    {playing ? (
                      <span aria-hidden className="flex items-center gap-0.5">
                        <span className="h-3 w-0.5 rounded-sm bg-ref-sun" />
                        <span className="h-3 w-0.5 rounded-sm bg-ref-sun" />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="ml-0.5 inline-block h-0 w-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-ref-sun"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    className={TT_ROLE_VIDEO_L5.cinemaChromeBtnClass}
                    aria-label={muted ? unmuteLabel : muteLabel}
                    data-tt-traveltrust-role-video-cinema-mute-toggle="1"
                    onClick={toggleMute}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 text-ref-sun"
                      fill="currentColor"
                    >
                      <path d="M2.5 6.2h2.1L8 3.8v8.4L4.6 9.8H2.5V6.2z" />
                      {muted ? (
                        <path d="M10.2 5.2l3.4 3.4-.9.9-3.4-3.4.9-.9zm3.4 0l.9.9-3.4 3.4-.9-.9 3.4-3.4z" />
                      ) : (
                        <path d="M9.6 5.4a3.2 3.2 0 010 5.2l-.7-1a2 2 0 000-3.2l.7-1zm1.5-1.7a5.2 5.2 0 010 8.6l-.7-1a4 4 0 000-6.6l.7-1z" />
                      )}
                    </svg>
                  </button>
                  <span
                    className={TT_ROLE_VIDEO_L5.cinemaTimeClass}
                    data-tt-traveltrust-role-video-cinema-time="1"
                  >
                    {formatCinemaTime(current)} / {formatCinemaTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
