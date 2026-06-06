"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";

export function useCommunityVideoOverlayFullscreenStage(overlayStageRef: RefObject<HTMLDivElement | null>) {
  const [inFullscreen, setInFullscreen] = useState(false);

  useEffect(() => {
    const onFs = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const el = document.fullscreenElement ?? doc.webkitFullscreenElement;
      setInFullscreen(el === overlayStageRef.current);
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs as EventListener);
    };
  }, [overlayStageRef]);

  const toggleStageFullscreen = useCallback(() => {
    const node = overlayStageRef.current;
    if (!node) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement;
    if (fsEl === node) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      else void doc.webkitExitFullscreen?.();
    } else {
      const req =
        node.requestFullscreen?.bind(node) ??
        (node as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(node);
      if (req) void Promise.resolve(req()).catch(() => {});
    }
  }, [overlayStageRef]);

  const fsSupported = useMemo(
    () =>
      typeof document !== "undefined" &&
      Boolean(
        document.fullscreenEnabled ||
          (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled,
      ),
    [],
  );

  return { inFullscreen, toggleStageFullscreen, fsSupported };
}
