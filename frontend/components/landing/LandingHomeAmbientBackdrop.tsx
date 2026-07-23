"use client";

import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { landingAmbientImageUrl, LANDING_AMBIENT_BY_COUNTRY_ZH } from "@/lib/landingAmbientByCountry";
import {
  landingAmbientCnRuntimeDataAttrs,
  logLandingAmbientCnRuntimeProbe,
} from "@/lib/catalogApi/landingAmbientCnDebug";
import { useLandingAmbientResolution } from "@/lib/catalogApi/useLandingAmbientUrl";

type Props = {
  /** 产品期国家中文名；空则 Catalog/COS 默认（CN Destination Ambient） */
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
  imgRef,
  onImgLoad,
}: {
  src: string;
  kenBurns: boolean;
  kenBurnsPaused?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  imgRef?: RefObject<HTMLImageElement | null>;
  onImgLoad?: (el: HTMLImageElement) => void;
}) {
  // No key={src}: remounting Ken Burns on every URL change looks like a second full refresh.
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={
          kenBurns
            ? `tt-home-ambient-ken-burns${kenBurnsPaused ? " tt-home-ambient-ken-burns-paused" : ""} absolute left-[-12%] top-[-12%] h-[124%] w-[124%]`
            : "absolute inset-0"
        }
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          decoding="async"
          fetchPriority={fetchPriority}
          className="h-full w-full object-cover object-center"
          draggable={false}
          onLoad={(e) => onImgLoad?.(e.currentTarget)}
        />
      </div>
    </div>
  );
}

/** 预加载 HD 图后再切换 outgoing 层（主层 derived-first，不阻塞 catalog/tsUrl） */
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
  const { selectedCountry, tsUrl, catalogUrl, runtimeUrl } = useLandingAmbientResolution(country);
  const defaultHomeUrl = useMemo(() => landingAmbientImageUrl(""), []);

  /** derived-first：已选国家 → catalog ?? tsUrl；空国家 → 仅 default fallback */
  const displaySrc = selectedCountry.trim()
    ? (catalogUrl ?? tsUrl)
    : (catalogUrl ?? defaultHomeUrl);

  const imgRef = useRef<HTMLImageElement>(null);
  const [imgCurrentSrc, setImgCurrentSrc] = useState("");
  const prevDisplayRef = useRef(displaySrc);
  const [outgoingSrc, setOutgoingSrc] = useState<string | null>(null);

  useEffect(() => {
    if (displaySrc === prevDisplayRef.current) return;
    const prev = prevDisplayRef.current;
    prevDisplayRef.current = displaySrc;
    setOutgoingSrc(prev);
    void preloadAmbientImage(displaySrc);
    const t = window.setTimeout(() => setOutgoingSrc(null), 700);
    return () => window.clearTimeout(t);
  }, [displaySrc]);

  /** HU-005：空闲预取十国 ambient，降低切换体感延迟 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const url of Object.values(LANDING_AMBIENT_BY_COUNTRY_ZH)) {
        void preloadAmbientImage(url);
      }
    };
    const ric = window.requestIdleCallback?.(run, { timeout: 2500 });
    const t = ric == null ? window.setTimeout(run, 400) : null;
    return () => {
      cancelled = true;
      if (ric != null && window.cancelIdleCallback) window.cancelIdleCallback(ric);
      if (t != null) window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const probe = {
      selectedCountry,
      tsUrl,
      runtimeUrl,
      shownSrc: displaySrc,
      imgCurrentSrc,
    };
    logLandingAmbientCnRuntimeProbe(probe);
  }, [selectedCountry, tsUrl, runtimeUrl, displaySrc, imgCurrentSrc]);

  const cnProbeAttrs = landingAmbientCnRuntimeDataAttrs({
    selectedCountry,
    tsUrl,
    runtimeUrl,
    shownSrc: displaySrc,
    imgCurrentSrc,
  });

  const kenBurns = !reducedMotion;
  const kenBurnsPaused = kenBurns && !pageVisible;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      data-tt-home-ambient-phase="A"
      data-tt-home-ambient-l5="ken-burns"
      data-tt-home-ambient-motion={reducedMotion ? "off" : pageVisible ? "on" : "paused"}
      data-tt-home-ambient-country={selectedCountry.trim() || "default"}
      data-tt-home-ambient-src={displaySrc}
      data-tt-home-ambient-ts-url={tsUrl}
      data-tt-home-ambient-runtime-url={runtimeUrl}
      {...cnProbeAttrs}
    >
      <div className="absolute inset-0 z-[1]">
        <AmbientPhotoLayer
          src={displaySrc}
          kenBurns={kenBurns}
          kenBurnsPaused={kenBurnsPaused}
          fetchPriority="high"
          imgRef={imgRef}
          onImgLoad={(el) => setImgCurrentSrc(el.currentSrc || el.src || "")}
        />
      </div>
      {outgoingSrc && outgoingSrc !== displaySrc && (
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
