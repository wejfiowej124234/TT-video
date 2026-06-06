"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import type { TravelTrustRoleConfig } from "@/app/traveltrust/traveltrustIdentityModel";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { useRoleMediaUrlsHydrated } from "@/lib/useTraveltrustMediaUrlsHydrated";
import {
  prefersTheaterWarmPlaceholder,
  resolveTheaterRoleWarmUi,
  TT_L5_MOTION_EASE,
  TT_ROLE_VIDEO_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
type Props = {
  role: TravelTrustRoleConfig;
  active: boolean;
  flashKey: number;
};

export function TravelTrustRoleVideoPlayer({ role, active, flashKey }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const { brief } = useTravelTrustPageBriefContext();
  const { media: roleMedia, hydrationSettled } = useRoleMediaUrlsHydrated(role, brief);
  const { mp4, webm, poster, tier: roleMediaTier } = roleMedia;
  /** ① tier-1 占位 MP4/海报偏冷青 — 强制暖色旅游占位（L5-1 · U1 前） */
  const preferWarmPlaceholder = prefersTheaterWarmPlaceholder(roleMediaTier);
  const mp4Src = communityMediaAbsoluteUrlForRender(mp4);
  const webmSrc = communityMediaAbsoluteUrlForRender(webm);
  const posterSrc = communityMediaAbsoluteUrlForRender(poster);
  const warmUi = resolveTheaterRoleWarmUi(role.id);
  const roleLabel = t(role.nameKey);
  const hintId = `tt-traveltrust-role-video-hint-${role.id}`;
  const videoRegionLabel = t("traveltrust_role_video_region_aria", { role: roleLabel });
  const posterAlt = t("traveltrust_role_video_poster_alt", { role: roleLabel });
  /** tier-1 暖占位仍保留 public MP4 — 与「有无播放入口」解耦 */
  const playable = Boolean(mp4Src) && !mediaError;

  useEffect(() => {
    if (!active) {
      setPlaying(false);
      setMediaError(false);
      videoRef.current?.pause();
    }
  }, [active, role.id]);

  /** 生产素材：Tab 切换后静音自动预览；暖占位需用户点播放 */
  useEffect(() => {
    if (!active || !playable || reduceMotion || mediaError || preferWarmPlaceholder) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const timer = window.setTimeout(() => {
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* 保留播放钮，由用户点击 */
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [active, playable, reduceMotion, mediaError, preferWarmPlaceholder, role.id, flashKey]);

  const onPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    trackTravelTrustEvent("traveltrust_role_video_play", {
      source: "roles",
      target: role.id,
      role: role.id,
    });
    void el.play().then(() => setPlaying(true)).catch(() => setMediaError(true));
  }, [role.id]);

  const showVideoLayer = active && playable && !reduceMotion && playing;
  const showStaticFrame = active && reduceMotion && Boolean(posterSrc);

  return (
    <motion.div
      className={`${TT_ROLE_VIDEO_L5.panelShellClass} [perspective:1400px]`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={active && !reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: TT_ROLE_VIDEO_L5.crossfadeDuration, ease: TT_L5_MOTION_EASE }}
    >
      <motion.div
        key={flashKey}
        id={`traveltrust-role-video-${role.id}`}
        role="group"
        aria-label={videoRegionLabel}
        data-tt-traveltrust-role-video="1"
        data-tt-traveltrust-role-video-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        data-tt-traveltrust-role-video-id={role.id}
        data-tt-traveltrust-role-media-tier={roleMediaTier}
        data-tt-traveltrust-role-media-hydration-settled={hydrationSettled ? "1" : "0"}
        data-tt-traveltrust-role-video-warm-placeholder-l5={preferWarmPlaceholder ? "1" : "0"}
        data-tt-traveltrust-role-video-playing={playing ? "1" : "0"}
        data-tt-traveltrust-role-video-autoplay="muted"
        data-tt-traveltrust-role-video-static-frame={showStaticFrame ? "1" : "0"}
        className={`${TT_ROLE_VIDEO_L5.frameClass} ${warmUi.ring} ${active ? warmUi.glow : TT_ROLE_VIDEO_L5.idleFrameBorderClass} ${playable && !playing && !reduceMotion ? "cursor-pointer" : ""}`}
        initial={reduceMotion ? false : { opacity: 0.92 }}
        animate={active && !reduceMotion ? { opacity: 1 } : { opacity: 1 }}
        transition={{ opacity: { duration: TT_ROLE_VIDEO_L5.panelRotateDuration } }}
        whileHover={active && !reduceMotion ? TT_ROLE_VIDEO_L5.panelHoverLift : undefined}
        onClick={(e) => {
          if (!playable || playing || reduceMotion) return;
          if ((e.target as HTMLElement).closest("[data-tt-traveltrust-role-video-play-cta]")) return;
          onPlay();
        }}
      >
        <motion.div className={TT_ROLE_VIDEO_L5.panelWarmLiftClass} aria-hidden />
        <motion.div className={TT_ROLE_VIDEO_L5.panelScrimClass} aria-hidden />
        {active && !reduceMotion ? (
          <motion.span
            className="pointer-events-none absolute inset-0 z-[3] rounded-2xl ring-1 ring-ref-sun/35"
            aria-hidden
            data-tt-traveltrust-role-video-frame-pulse-l5="1"
            animate={{ opacity: [...TT_ROLE_VIDEO_L5.frameBorderPulse.opacity] }}
            transition={{
              duration: TT_ROLE_VIDEO_L5.frameBorderPulse.duration,
              repeat: 0,
              ease: "easeInOut",
            }}
          />
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role.id}-${flashKey}`}
            className={`pointer-events-none absolute inset-0 z-[4] ${warmUi.flash}`}
            initial={{ opacity: reduceMotion ? 0 : TT_ROLE_VIDEO_L5.flashPeakOpacity }}
            animate={{ opacity: 0 }}
            transition={{ duration: TT_ROLE_VIDEO_L5.flashDuration }}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {active && posterSrc && !preferWarmPlaceholder ? (
            <motion.div
              key={`poster-${role.id}`}
              className="absolute inset-0 z-[1] overflow-hidden"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TT_ROLE_VIDEO_L5.posterFadeDuration, ease: TT_L5_MOTION_EASE }}
            >
              <motion.div
                className="h-full w-full"
                initial={reduceMotion ? false : { scale: 1.04 }}
                animate={reduceMotion ? undefined : { scale: 1.12 }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        scale: {
                          duration: TT_ROLE_VIDEO_L5.posterKenBurnsDuration,
                          repeat: TT_ROLE_VIDEO_L5.posterKenBurnsRepeat,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        },
                      }
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterSrc}
                  alt={posterAlt}
                  className={`${TT_ROLE_VIDEO_L5.mediaCoverClass} ${reduceMotion ? "opacity-95" : "opacity-80"}`}
                  fetchPriority={reduceMotion ? "high" : undefined}
                  decoding="async"
                />
                <motion.div
                  className={TT_ROLE_VIDEO_L5.posterWarmGradeClass}
                  aria-hidden
                  data-tt-traveltrust-role-video-poster-warm-l5="1"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: TT_ROLE_VIDEO_L5.posterFadeDuration, ease: TT_L5_MOTION_EASE }}
                />
                <div
                  className={TT_ROLE_VIDEO_L5.posterWarmVignetteClass}
                  aria-hidden
                  data-tt-traveltrust-role-video-poster-vignette-l5="1"
                />
              </motion.div>
              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)] motion-reduce:hidden"
                  aria-hidden
                  initial={{ x: "-130%" }}
                  animate={{ x: "130%" }}
                  transition={{
                    duration: TT_ROLE_VIDEO_L5.posterShimmerDuration,
                    repeat: TT_ROLE_VIDEO_L5.posterShimmerRepeat,
                    repeatDelay: TT_ROLE_VIDEO_L5.posterShimmerRepeatDelay,
                    ease: "easeInOut",
                  }}
                />
              ) : null}
            </motion.div>
          ) : active ? (
            <motion.div
              key={`grad-${role.id}`}
              className={TT_ROLE_VIDEO_L5.placeholderShellClass}
              role="img"
              aria-label={posterAlt}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TT_ROLE_VIDEO_L5.posterFadeDuration }}
            >
              <motion.div className={TT_ROLE_VIDEO_L5.placeholderGridClass} aria-hidden />
              <div className={TT_ROLE_VIDEO_L5.placeholderFrameClass} aria-hidden data-tt-traveltrust-role-video-placeholder-frame-l5="1" />
              <div className={TT_ROLE_VIDEO_L5.placeholderPhotoClass} aria-hidden data-tt-traveltrust-role-video-placeholder-photo-l5="1" />
              <motion.div className={TT_ROLE_VIDEO_L5.placeholderPinClass} aria-hidden />
              <motion.div className={`${TT_ROLE_VIDEO_L5.placeholderGradientOverlayClass} bg-gradient-to-br ${warmUi.gradient}`} aria-hidden />
              {!reduceMotion ? (
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
                  <motion.path
                    d="M 40 180 Q 120 60, 200 120 T 360 80"
                    fill="none"
                    stroke="#fca47c"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeDasharray="5 12"
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{
                      pathLength: 1,
                      opacity: [
                        TT_ROLE_VIDEO_L5.placeholderRouteOpacity,
                        TT_ROLE_VIDEO_L5.placeholderRouteOpacity + 0.2,
                        TT_ROLE_VIDEO_L5.placeholderRouteOpacity,
                      ],
                      strokeDashoffset: [0, -24, 0],
                    }}
                    transition={{
                      pathLength: { duration: TT_ROLE_VIDEO_L5.placeholderPathDrawDuration, ease: TT_L5_MOTION_EASE },
                      opacity: {
                        duration: TT_ROLE_VIDEO_L5.placeholderPulseDuration,
                        repeat: TT_ROLE_VIDEO_L5.placeholderPathRepeat,
                        ease: "easeInOut",
                      },
                      strokeDashoffset: {
                        duration: TT_ROLE_VIDEO_L5.placeholderDashOffsetDuration,
                        repeat: TT_ROLE_VIDEO_L5.placeholderPathRepeat,
                        ease: "linear",
                      },
                    }}
                  />
                  <motion.path
                    d="M 60 200 Q 160 140, 280 160"
                    fill="none"
                    stroke="#ffd4a8"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1, opacity: [0.1, 0.2, 0.1] }}
                    transition={{
                      pathLength: { duration: TT_ROLE_VIDEO_L5.placeholderSecondaryPathDuration, ease: TT_L5_MOTION_EASE },
                      opacity: {
                        duration: TT_ROLE_VIDEO_L5.placeholderPulseDuration * 1.1,
                        repeat: TT_ROLE_VIDEO_L5.placeholderPathRepeat,
                        ease: "easeInOut",
                      },
                    }}
                  />
                </svg>
              ) : null}
              <motion.div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(252,164,124,0.16),transparent_70%)]"
                aria-hidden
                animate={reduceMotion ? undefined : { opacity: [0.5, 0.82, 0.5] }}
                transition={{
                  duration: TT_ROLE_VIDEO_L5.placeholderPulseDuration,
                  repeat: TT_ROLE_VIDEO_L5.placeholderPathRepeat,
                  ease: "easeInOut",
                }}
              />
              {!(playable && !playing) ? (
                <motion.div
                  className={TT_ROLE_VIDEO_L5.placeholderCopyClass}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: TT_ROLE_VIDEO_L5.posterFadeDuration, ease: TT_L5_MOTION_EASE }}
                  data-tt-traveltrust-role-video-placeholder-copy-l5="1"
                >
                  <p className={TT_ROLE_VIDEO_L5.placeholderRoleTitleClass}>{roleLabel}</p>
                  {preferWarmPlaceholder ? (
                    <span
                      className={TT_ROLE_VIDEO_L5.placeholderTourismBadgeClass}
                      data-tt-traveltrust-role-video-tourism-badge-l5="1"
                    >
                      {t("traveltrust_role_video_placeholder_tourism_badge")}
                    </span>
                  ) : null}
                  <p
                    className={
                      preferWarmPlaceholder
                        ? TT_ROLE_VIDEO_L5.placeholderTourismHintClass
                        : TT_ROLE_VIDEO_L5.placeholderHintClass
                    }
                    data-tt-traveltrust-role-video-tourism-hint-l5={preferWarmPlaceholder ? "1" : "0"}
                  >
                    {mediaError
                      ? t("traveltrust_role_video_error")
                      : preferWarmPlaceholder
                        ? t("traveltrust_role_video_placeholder_tourism")
                        : t("traveltrust_video_placeholder_short")}
                  </p>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {active && playable && !reduceMotion ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 z-[2] box-border ${TT_ROLE_VIDEO_L5.mediaCoverClass} max-w-full transition-opacity duration-300 motion-reduce:hidden ${showVideoLayer ? "opacity-95 saturate-[0.92] sepia-[0.14] hue-rotate-[-6deg]" : "opacity-0"}`}
            playsInline
            muted
            preload={active ? "metadata" : "none"}
            poster={posterSrc || undefined}
            controls={playing}
            controlsList="nodownload noremoteplayback noplaybackrate"
            aria-label={videoRegionLabel}
            data-tt-traveltrust-role-video-native-controls={playing ? "1" : "0"}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setMediaError(true)}
          >
            {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
            {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
          </video>
        ) : null}

        {active && (showVideoLayer || (playable && posterSrc && !playing)) ? (
          <div
            className={TT_ROLE_VIDEO_L5.videoWarmGradeClass}
            aria-hidden
            data-tt-traveltrust-role-video-warm-grade-l5="1"
          />
        ) : null}

        {!playing && active && !showStaticFrame ? (
          <motion.div
            className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2.5 px-4"
            data-tt-traveltrust-role-video-play-overlay="1"
          >
            {playable && !reduceMotion ? (
              <>
                <motion.div
                  className={TT_ROLE_VIDEO_L5.playHaloClass}
                  aria-hidden
                  data-tt-traveltrust-role-video-warm-play-halo-l5="1"
                  animate={{ opacity: [...TT_ROLE_VIDEO_L5.playHaloOpacity], scale: [1, 1.12, 1] }}
                  transition={{
                    duration: TT_ROLE_VIDEO_L5.playHaloDuration,
                    repeat: TT_ROLE_VIDEO_L5.playHaloRepeat,
                    ease: "easeInOut",
                  }}
                />
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay();
                  }}
                  className={TT_ROLE_VIDEO_L5.playCtaClass}
                  aria-label={t("traveltrust_video_play")}
                  aria-describedby={hintId}
                  data-tt-traveltrust-role-video-play-cta="1"
                  data-tt-traveltrust-role-video-play-cta-l5="1"
                  whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          duration: TT_ROLE_VIDEO_L5.playCtaPulseDuration,
                          repeat: TT_ROLE_VIDEO_L5.playCtaPulseRepeat,
                          ease: "easeInOut",
                        }
                  }
                >
                  <span className="ml-0.5 text-h4" aria-hidden>
                    ▶
                  </span>
                </motion.button>
                <p
                  id={hintId}
                  className="max-w-[16rem] text-center text-meta font-medium leading-snug text-slate-100/92 drop-shadow-sm"
                  data-tt-traveltrust-role-video-play-hint-visible-l5="1"
                >
                  {preferWarmPlaceholder
                    ? t("traveltrust_role_video_tap_to_play")
                    : t("traveltrust_role_video_play_hint")}
                </p>
              </>
            ) : posterSrc ? (
              <p
                className="relative max-w-xs rounded-lg bg-ink-950/55 px-4 py-2 text-center text-meta text-slate-300 backdrop-blur-sm"
                role="status"
              >
                {mediaError ? t("traveltrust_role_video_error") : t("traveltrust_video_placeholder_short")}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
