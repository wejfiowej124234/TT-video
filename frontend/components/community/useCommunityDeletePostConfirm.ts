"use client";

import { useCallback, useRef, useState } from "react";

/** L5 删除确认：替代 `window.confirm`，支持 focus 回退与 busy 态 */
export function useCommunityDeletePostConfirm(performDelete: (postId: string) => Promise<void>) {
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const focusReturnRef = useRef<HTMLElement | null>(null);

  const requestDeletePost = useCallback((postId: string, trigger?: HTMLElement | null) => {
    focusReturnRef.current = trigger ?? null;
    setPendingPostId(postId);
  }, []);

  const cancelDeletePost = useCallback(() => {
    setPendingPostId(null);
    const prev = focusReturnRef.current;
    focusReturnRef.current = null;
    requestAnimationFrame(() => prev?.focus());
  }, []);

  const confirmDeletePost = useCallback(async () => {
    if (!pendingPostId || confirmBusy) return;
    const id = pendingPostId;
    setConfirmBusy(true);
    try {
      await performDelete(id);
      setPendingPostId(null);
      focusReturnRef.current = null;
    } finally {
      setConfirmBusy(false);
    }
  }, [pendingPostId, confirmBusy, performDelete]);

  return {
    deleteConfirmPostId: pendingPostId,
    deleteConfirmBusy: confirmBusy,
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost,
  };
}
