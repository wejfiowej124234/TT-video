"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

/** 登录弹层 Escape 关闭（焦点回退与 `useCommunityFeed` 内声明顺序同源）。 */
export function useCommunityFeedEscapeKeyHandlers(options: {
  showLoginModal: boolean;
  setShowLoginModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { showLoginModal, setShowLoginModal } = options;

  useEffect(() => {
    if (!showLoginModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLoginModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowLoginModal, showLoginModal]);
}
