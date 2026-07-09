"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  l5CardMediaCacheBustSrc,
  l5CardMediaIsTiny,
  l5CardMediaSyncFromImgElement,
} from "@/lib/l5CardMediaPlaceholder";

/** Community masonry thumb: same reveal chain as {@link useL5CardMediaReveal}. */
export function useL5CardMediaThumbReveal(thumbSrc: string) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [thumbIsTiny, setThumbIsTiny] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(thumbSrc);
  const cacheBustRef = useRef<0 | 1>(0);

  useEffect(() => {
    cacheBustRef.current = 0;
    setMediaLoaded(false);
    setMediaError(false);
    setThumbIsTiny(false);
    setDisplaySrc(thumbSrc);
  }, [thumbSrc]);

  const tryRecoverOrFail = useCallback(() => {
    if (cacheBustRef.current === 0) {
      cacheBustRef.current = 1;
      setMediaLoaded(false);
      setDisplaySrc(l5CardMediaCacheBustSrc(thumbSrc, 1));
      return;
    }
    setThumbIsTiny(true);
  }, [thumbSrc]);

  const applyNaturalSize = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (l5CardMediaIsTiny(naturalWidth, naturalHeight)) {
        tryRecoverOrFail();
        return;
      }
      if (naturalWidth > 0 && naturalHeight > 0) setMediaLoaded(true);
    },
    [tryRecoverOrFail],
  );

  const onLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      applyNaturalSize(img.naturalWidth, img.naturalHeight);
    },
    [applyNaturalSize],
  );

  const onError = useCallback(() => {
    if (cacheBustRef.current === 0) {
      cacheBustRef.current = 1;
      setMediaLoaded(false);
      setDisplaySrc(l5CardMediaCacheBustSrc(thumbSrc, 1));
      return;
    }
    setMediaError(true);
  }, [thumbSrc]);

  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      const outcome = l5CardMediaSyncFromImgElement(node);
      if (outcome === "revealed" && node) {
        applyNaturalSize(node.naturalWidth, node.naturalHeight);
      } else if (outcome === "tiny" && node) {
        applyNaturalSize(node.naturalWidth, node.naturalHeight);
      }
    },
    [applyNaturalSize],
  );

  const resetForRetry = useCallback(() => {
    cacheBustRef.current = 0;
    setMediaError(false);
    setMediaLoaded(false);
    setThumbIsTiny(false);
    setDisplaySrc(thumbSrc);
  }, [thumbSrc]);

  return {
    mediaLoaded,
    mediaError,
    thumbIsTiny,
    displaySrc,
    onLoad,
    onError,
    imgRef,
    resetForRetry,
  };
}
