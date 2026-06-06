"use client";

import { useCallback, useRef, useState } from "react";

/** L5 取消收藏确认：替代菜单一点即取消，支持 focus 回退与 busy 态 */
export function useCommunityMeUncollectConfirm(performUncollect: (postId: string) => Promise<void>) {
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const focusReturnRef = useRef<HTMLElement | null>(null);

  const requestUncollect = useCallback((postId: string, trigger?: HTMLElement | null) => {
    focusReturnRef.current = trigger ?? null;
    setPendingPostId(postId);
  }, []);

  const cancelUncollect = useCallback(() => {
    setPendingPostId(null);
    const prev = focusReturnRef.current;
    focusReturnRef.current = null;
    requestAnimationFrame(() => prev?.focus());
  }, []);

  const confirmUncollect = useCallback(async () => {
    if (!pendingPostId || confirmBusy) return;
    const id = pendingPostId;
    setConfirmBusy(true);
    try {
      await performUncollect(id);
      setPendingPostId(null);
      focusReturnRef.current = null;
    } finally {
      setConfirmBusy(false);
    }
  }, [pendingPostId, confirmBusy, performUncollect]);

  return {
    uncollectConfirmPostId: pendingPostId,
    uncollectConfirmBusy: confirmBusy,
    requestUncollect,
    cancelUncollect,
    confirmUncollect,
  };
}
