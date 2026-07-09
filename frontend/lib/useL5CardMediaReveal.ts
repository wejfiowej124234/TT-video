"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  l5CardMediaCacheBustSrc,
  l5CardMediaIsTiny,
  l5CardMediaResolvedAcceptable,
  l5CardMediaSyncFromImgElement,
} from "@/lib/l5CardMediaPlaceholder";

/**
 * L5 card media reveal: gradient underlay until valid decode, one cache-bust retry, then degrade.
 */
export function useL5CardMediaReveal(resolvedSrc: string) {
  const [degraded, setDegraded] = useState(() => !l5CardMediaResolvedAcceptable(resolvedSrc));
  const [revealed, setRevealed] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(resolvedSrc);
  const cacheBustRef = useRef<0 | 1>(0);

  useEffect(() => {
    cacheBustRef.current = 0;
    setDegraded(!l5CardMediaResolvedAcceptable(resolvedSrc));
    setRevealed(false);
    setDisplaySrc(resolvedSrc);
  }, [resolvedSrc]);

  const tryRecoverOrDegrade = useCallback(() => {
    if (cacheBustRef.current === 0) {
      cacheBustRef.current = 1;
      setRevealed(false);
      setDisplaySrc(l5CardMediaCacheBustSrc(resolvedSrc, 1));
      return;
    }
    setDegraded(true);
  }, [resolvedSrc]);

  const applyNaturalSize = useCallback(
    (naturalWidth: number, naturalHeight: number) => {
      if (l5CardMediaIsTiny(naturalWidth, naturalHeight)) {
        tryRecoverOrDegrade();
        return;
      }
      if (naturalWidth > 0 && naturalHeight > 0) setRevealed(true);
    },
    [tryRecoverOrDegrade],
  );

  const onLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      applyNaturalSize(img.naturalWidth, img.naturalHeight);
    },
    [applyNaturalSize],
  );

  const onError = useCallback(() => {
    tryRecoverOrDegrade();
  }, [tryRecoverOrDegrade]);

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

  return { degraded, revealed, displaySrc, onLoad, onError, imgRef };
}
