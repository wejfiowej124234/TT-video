"use client";

import { useCallback, useRef, useState } from "react";

/** L5 取消赞确认：替代菜单一点即 unlike，支持 focus 回退与 busy 态 */
export function useCommunityMeUnlikeConfirm(performUnlike: (postId: string) => Promise<void>) {
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const focusReturnRef = useRef<HTMLElement | null>(null);

  const requestUnlike = useCallback((postId: string, trigger?: HTMLElement | null) => {
    focusReturnRef.current = trigger ?? null;
    setPendingPostId(postId);
  }, []);

  const cancelUnlike = useCallback(() => {
    setPendingPostId(null);
    const prev = focusReturnRef.current;
    focusReturnRef.current = null;
    requestAnimationFrame(() => prev?.focus());
  }, []);

  const confirmUnlike = useCallback(async () => {
    if (!pendingPostId || confirmBusy) return;
    const id = pendingPostId;
    setConfirmBusy(true);
    try {
      await performUnlike(id);
      setPendingPostId(null);
      focusReturnRef.current = null;
    } finally {
      setConfirmBusy(false);
    }
  }, [pendingPostId, confirmBusy, performUnlike]);

  return {
    unlikeConfirmPostId: pendingPostId,
    unlikeConfirmBusy: confirmBusy,
    requestUnlike,
    cancelUnlike,
    confirmUnlike,
  };
}
