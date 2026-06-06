"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { landingAmbientImageUrl } from "@/lib/landingAmbientByCountry";

type Props = {
  /** 产品期国家中文名；空则 `AMBIENT_BG_HOME` 默认图 */
  country: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

/** 内层画布 124% · 顶左锚定，避免 translate 居中裁切半屏 */
function AmbientPhotoLayer({
  src,
  kenBurns,
  kenBurnsPaused,
  fetchPriority,
}: {
  src: string;
  kenBurns: boolean;
  kenBurnsPaused?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        key={src}
        className={
          kenBurns
            ? `tt-home-ambient-ken-burns${kenBurnsPaused ? " tt-home-ambient-ken-burns-paused" : ""} absolute left-[-12%] top-[-12%] h-[124%] w-[124%]`
            : "absolute inset-0"
        }
      >
        <img
          src={src}
          alt=""
          decoding="async"
          fetchPriority={fetchPriority}
          className="h-full w-full object-cover object-center"
          draggable={false}
        />
      </div>
    </div>
  );
}

/** 预加载 HD 图后再切换，避免新图未解码时 z 上层透明导致「点了没换」 */
function preloadAmbientImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
    if (img.complete) resolve();
  });
}

/** Phase A：每国 1 张 HD 图 + CSS Ken Burns（Phase B 视频层未接线）。 */
function LandingHomeAmbientBackdropInner({ country }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const targetSrc = useMemo(() => landingAmbientImageUrl(country), [country]);
  const [shownSrc, setShownSrc] = useState(targetSrc);
  const [outgoingSrc, setOutgoingSrc] = useState<string | null>(null);
  const shownRef = useRef(shownSrc);
  shownRef.current = shownSrc;

  useEffect(() => {
    if (targetSrc === shownRef.current) return;

    let cancelled = false;
    void preloadAmbientImage(targetSrc).then(() => {
      if (cancelled || targetSrc === shownRef.current) return;
      setOutgoingSrc(shownRef.current);
      setShownSrc(targetSrc);
    });

    return () => {
      cancelled = true;
    };
  }, [targetSrc]);

  useEffect(() => {
    if (!outgoingSrc) return;
    const t = window.setTimeout(() => setOutgoingSrc(null), 700);
    return () => window.clearTimeout(t);
  }, [outgoingSrc]);

  const kenBurns = !reducedMotion;
  const kenBurnsPaused = kenBurns && !pageVisible;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      data-tt-home-ambient-phase="A"
      data-tt-home-ambient-l5="ken-burns"
      data-tt-home-ambient-motion={reducedMotion ? "off" : pageVisible ? "on" : "paused"}
      data-tt-home-ambient-country={country.trim() || "default"}
      data-tt-home-ambient-src={shownSrc}
    >
      <div className="absolute inset-0 z-[1]">
        <AmbientPhotoLayer
          src={shownSrc}
          kenBurns={kenBurns}
          kenBurnsPaused={kenBurnsPaused}
          fetchPriority="high"
        />
      </div>
      {outgoingSrc && (
        <div className="absolute inset-0 z-[2] tt-home-ambient-crossfade-out" aria-hidden>
          <AmbientPhotoLayer src={outgoingSrc} kenBurns={false} />
        </div>
      )}
      <div className="absolute inset-0 z-[3] bg-black/10" aria-hidden />
    </div>
  );
}

const LandingHomeAmbientBackdrop = memo(LandingHomeAmbientBackdropInner);
export default LandingHomeAmbientBackdrop;
