"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import type { TravelTrustRoleConfig } from "@/app/traveltrust/traveltrustIdentityModel";
import { trackTravelTrustEvent } from "@/lib/analytics";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { resolveRoleMediaFromBrief } from "@/lib/traveltrustMediaFromBrief";
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
  const { mp4, webm, poster } = resolveRoleMediaFromBrief(role, brief);
  const mp4Src = communityMediaAbsoluteUrlForRender(mp4);
  const webmSrc = communityMediaAbsoluteUrlForRender(webm);
  const posterSrc = communityMediaAbsoluteUrlForRender(poster);
  const roleLabel = t(role.nameKey);
  const hintId = `tt-traveltrust-role-video-hint-${role.id}`;
  const videoRegionLabel = t("traveltrust_role_video_region_aria", { role: roleLabel });
  const posterAlt = t("traveltrust_role_video_poster_alt", { role: roleLabel });
  const playable = Boolean(mp4Src) && !mediaError;

  useEffect(() => {
    if (!active) {
      setPlaying(false);
      setMediaError(false);
      videoRef.current?.pause();
    }
  }, [active, role.id]);

  /** 停留约 3s 后尝试静音预览（E2E 在点击后即时断言播放钮，不受影响） */
  useEffect(() => {
    if (!active || !playable || reduceMotion || playing || mediaError) return;
    const timer = window.setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      el.muted = true;
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* 保留播放钮，由用户点击 */
        });
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [active, playable, reduceMotion, playing, mediaError, role.id, flashKey]);

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
      className="[perspective:1400px]"
      initial={reduceMotion ? false : { opacity: 0.92, rotateX: 4 }}
      animate={active && !reduceMotion ? { opacity: 1, rotateX: 0 } : undefined}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        key={flashKey}
        id={`traveltrust-role-video-${role.id}`}
        role="group"
        aria-label={videoRegionLabel}
        data-tt-traveltrust-role-video="1"
        data-tt-traveltrust-role-video-id={role.id}
        data-tt-traveltrust-role-video-playing={playing ? "1" : "0"}
        data-tt-traveltrust-role-video-static-frame={showStaticFrame ? "1" : "0"}
        className={`relative min-h-[min(50vh,420px)] w-full overflow-hidden rounded-2xl border bg-ink-950/80 [transform-style:preserve-3d] sm:min-h-[min(58vh,520px)] ${role.accent.ring} ${active ? role.accent.glow : "border-white/10"}`}
        initial={reduceMotion ? false : { rotateY: -8, opacity: 0.88 }}
        animate={
          active && !reduceMotion
            ? {
                rotateY: 0,
                opacity: 1,
                boxShadow: [
                  "0 0 0 0 rgba(35,206,217,0)",
                  "0 0 40px 0 rgba(35,206,217,0.16)",
                  "0 0 0 0 rgba(35,206,217,0)",
                ],
              }
            : { rotateY: 0, opacity: 1 }
        }
        transition={{
          rotateY: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.45 },
          boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={
          active && !reduceMotion ? { rotateY: -2.5, rotateX: 1.5, scale: 1.012 } : undefined
        }
      >
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,transparent_18%,transparent_82%,rgba(0,0,0,0.65)_100%)]"
          aria-hidden
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role.id}-${flashKey}`}
            className={`pointer-events-none absolute inset-0 z-[4] ${role.accent.flash}`}
            initial={{ opacity: reduceMotion ? 0 : 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {active && posterSrc ? (
            <motion.div
              key={`poster-${role.id}`}
              className="absolute inset-0 z-[1] overflow-hidden"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
                          duration: 20,
                          repeat: Infinity,
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
                  className={`h-full min-h-[min(50vh,420px)] w-full object-cover sm:min-h-[min(58vh,520px)] ${reduceMotion ? "opacity-95" : "opacity-80"}`}
                  fetchPriority={reduceMotion ? "high" : undefined}
                  decoding="async"
                />
              </motion.div>
              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)] motion-reduce:hidden"
                  aria-hidden
                  initial={{ x: "-130%" }}
                  animate={{ x: "130%" }}
                  transition={{ duration: 5.2, repeat: Infinity, repeatDelay: 4.8, ease: "easeInOut" }}
                />
              ) : null}
            </motion.div>
          ) : active ? (
            <motion.div
              key={`grad-${role.id}`}
              className="absolute inset-0 z-[1] bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900"
              aria-hidden
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
            />
          ) : null}
        </AnimatePresence>

        {active && playable && !reduceMotion ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 z-[2] h-full min-h-[min(50vh,420px)] w-full object-cover transition-opacity duration-300 motion-reduce:hidden sm:min-h-[min(58vh,520px)] ${showVideoLayer ? "opacity-100" : "opacity-0"}`}
            playsInline
            muted
            preload={active ? "metadata" : "none"}
            poster={posterSrc || undefined}
            controls={playing}
            aria-label={videoRegionLabel}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setMediaError(true)}
          >
            {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
            {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
          </video>
        ) : null}

        {!playing && active && !showStaticFrame ? (
          <motion.div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 px-4">
            {playable && !reduceMotion ? (
              <>
                <motion.button
                  type="button"
                  onClick={onPlay}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-ink-900/50 text-white shadow-scifi-panel backdrop-blur-md transition hover:scale-105 hover:border-ref-coral/50 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/60"
                  aria-label={t("traveltrust_video_play")}
                  aria-describedby={hintId}
                  data-tt-traveltrust-role-video-play-cta="1"
                  animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  <span className="ml-1 text-h4" aria-hidden>
                    ▶
                  </span>
                </motion.button>
                <p id={hintId} className="sr-only">
                  {t("traveltrust_role_video_play_hint")}
                </p>
              </>
            ) : (
              <p
                className="relative max-w-xs rounded-lg bg-ink-950/55 px-4 py-2 text-center text-meta text-slate-300 backdrop-blur-sm"
                role="status"
              >
                {mediaError ? t("traveltrust_role_video_error") : t("traveltrust_video_placeholder_short")}
              </p>
            )}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
