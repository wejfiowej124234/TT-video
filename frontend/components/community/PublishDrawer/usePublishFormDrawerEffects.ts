"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface UsePublishFormDrawerEffectsArgs {
  onClose: () => void;
  backButtonRef: RefObject<HTMLButtonElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  previewUrls: string[];
}

/**
 * 发布抽屉：首焦、入场帧、容器内 Tab 陷阱、Escape、body 滚动锁、blob 预览卸载清理。
 */
export function usePublishFormDrawerEffects({
  onClose,
  backButtonRef,
  containerRef,
  previewUrls,
}: UsePublishFormDrawerEffectsArgs) {
  const [entered, setEntered] = useState(false);
  const previewUrlsRef = useRef(previewUrls);
  previewUrlsRef.current = previewUrls;

  useEffect(() => {
    backButtonRef.current?.focus({ preventScroll: true });
  }, [backButtonRef]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const focusables =
      "button:not([disabled]), [href], input:not([type=hidden]):not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=-1])";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = el.querySelectorAll<HTMLElement>(focusables);
      const list = Array.from(nodes).filter((n) => n.offsetParent != null && !n.hasAttribute("aria-hidden"));
      if (list.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? list.indexOf(active) : -1;
      const first = list[0];
      const last = list[list.length - 1];
      let target: HTMLElement | undefined;
      if (e.shiftKey) {
        target = active === first ? last : idx > 0 ? list[idx - 1] : undefined;
      } else {
        target = active === last ? first : idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;
      }
      if (target) {
        e.preventDefault();
        target.focus();
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [containerRef]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return { entered };
}
