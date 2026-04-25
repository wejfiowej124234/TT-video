"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";

const MP4 = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_VIDEO_MP4?.trim() ?? "" : "";
const WEBM = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_VIDEO_WEBM?.trim() ?? "" : "";
const POSTER = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TRAVELTRUST_VIDEO_POSTER?.trim() ?? "" : "";

/**
 * 85 §九 / §廿一：进入视口后再挂载 video；不自动播放；成片须 08-4 审查。
 */
export default function TravelTrustVideoBlock() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const hasSrc = Boolean(MP4 || WEBM);

  useEffect(() => {
    if (!hasSrc || reduceMotion === true) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setInView(true);
      },
      { rootMargin: "100px 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasSrc, reduceMotion]);

  return (
    <div ref={rootRef} className="mt-4 space-y-2">
      {!hasSrc ? (
        <div
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-white/20 bg-ink-800/40 px-4 py-8 text-center text-meta text-slate-400"
          role="status"
        >
          <span aria-hidden className="text-body-l opacity-60">
            ▶
          </span>
          <span>{t("traveltrust_video_placeholder")}</span>
        </div>
      ) : reduceMotion === true ? (
        POSTER ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- static poster URL; reduced-motion branch */}
            <img
              src={POSTER}
              alt={t("traveltrust_video_poster_alt")}
              fetchPriority="high"
              decoding="async"
              className="w-full max-h-[min(70vh,520px)] rounded-[var(--radius-md)] border border-white/15 bg-black/40 object-contain shadow-scifi-panel"
            />
          </>
        ) : (
          <div
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/12 bg-ink-800/50 px-4 py-8 text-center text-meta text-slate-400 backdrop-blur-sm"
            role="status"
          >
            <span aria-hidden className="text-body-l opacity-60">
              ▶
            </span>
            <span>{t("traveltrust_video_reduced_motion_static")}</span>
          </div>
        )
      ) : !inView ? (
        <div
          className="flex min-h-[200px] items-center justify-center rounded-[var(--radius-md)] border border-white/12 bg-ink-800/50 text-meta text-slate-400 motion-sub animate-pulse motion-reduce:animate-none backdrop-blur-sm"
          role="status"
          aria-busy="true"
        >
          {t("traveltrust_video_loading_slot")}
        </div>
      ) : (
        <video
          className="w-full max-h-[min(70vh,520px)] rounded-[var(--radius-md)] border border-white/15 bg-black/40 object-contain shadow-scifi-panel"
          controls
          playsInline
          preload="metadata"
          poster={POSTER || undefined}
        >
          {WEBM ? <source src={WEBM} type="video/webm" /> : null}
          {MP4 ? <source src={MP4} type="video/mp4" /> : null}
        </video>
      )}
      <p className="text-meta text-slate-400" role="note">
        {!hasSrc
          ? t("traveltrust_video_poster_hint")
          : reduceMotion === true
            ? t("traveltrust_video_reduced_motion_note")
            : t("traveltrust_video_load_disclosure")}
      </p>
    </div>
  );
}
