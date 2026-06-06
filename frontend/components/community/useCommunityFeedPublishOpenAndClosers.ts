"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useRouter, type ReadonlyURLSearchParams } from "next/navigation";
import type { CommunityPost } from "@/lib/communityMockData";
import type { OpenPublishFn } from "@/components/community/CommunityPublishContext";

function stripPublishQueryUsingRouter(router: {
  replace: (href: string, options?: { scroll?: boolean }) => void;
}) {
  if (typeof window === "undefined") return;
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.get("publish") !== "1") return;
    u.searchParams.delete("publish");
    u.searchParams.delete("publishType");
    const qs = u.search;
    const href = `${u.pathname}${qs === "?" || qs === "" ? "" : qs}`;
    router.replace(href, { scroll: false });
  } catch {
    /* ignore */
  }
}

/** `?publish=1` 与 `registerOpenPublish`（须在 `useCommunityFeed` 内紧接 **`setFeedPage` 的 effect** 之后调用，以保持 effect 顺序）。
 * **不在此 effect 内改 URL**：开发态下 `router.replace`/`replaceState` 与 Feed 挂载并发易触发 **`app/community/error`**；`publish=1` 保留至 **`closePublishDrawer`** 再清。 */
export function useCommunityFeedPublishQueryAndRegister(options: {
  searchParams: ReadonlyURLSearchParams;
  authLoading: boolean;
  isLoggedIn: boolean;
  registerOpenPublish?: (fn: OpenPublishFn) => () => void;
  setFocusReturn: (el: HTMLElement | null) => void;
  setShowLoginModal: Dispatch<SetStateAction<boolean>>;
  setPublishOpen: Dispatch<SetStateAction<boolean>>;
  setPublishSendFailed: Dispatch<SetStateAction<boolean>>;
  setPublishErrorMessage: Dispatch<SetStateAction<string | null>>;
}) {
  const {
    searchParams,
    authLoading,
    isLoggedIn,
    registerOpenPublish,
    setFocusReturn,
    setShowLoginModal,
    setPublishOpen,
    setPublishSendFailed,
    setPublishErrorMessage,
  } = options;

  /** `gotoWithBearerSession` 首跳常无 token；`?publish=1` 须在 `authLoading` 结束后再开抽屉（与 `openPublish` 的 `pendingOpenAfterAuthRef` 同源）。 */
  const pendingPublishFromQueryRef = useRef(false);

  useEffect(() => {
    return () => {
      pendingPublishFromQueryRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let hasPublishParam = searchParams.get("publish") === "1";
    if (!hasPublishParam) {
      try {
        hasPublishParam = new URL(window.location.href).searchParams.get("publish") === "1";
      } catch {
        /* ignore */
      }
    }

    if (!hasPublishParam) {
      pendingPublishFromQueryRef.current = false;
      return;
    }
    if (authLoading) {
      pendingPublishFromQueryRef.current = true;
      return;
    }

    pendingPublishFromQueryRef.current = false;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishOpen(true);
  }, [
    authLoading,
    isLoggedIn,
    searchParams,
    setPublishErrorMessage,
    setPublishOpen,
    setPublishSendFailed,
    setShowLoginModal,
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!pendingPublishFromQueryRef.current) return;

    let hasPublishParam = searchParams.get("publish") === "1";
    if (!hasPublishParam) {
      try {
        hasPublishParam = new URL(window.location.href).searchParams.get("publish") === "1";
      } catch {
        /* ignore */
      }
    }
    if (!hasPublishParam) {
      pendingPublishFromQueryRef.current = false;
      return;
    }

    pendingPublishFromQueryRef.current = false;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    setPublishOpen(true);
  }, [
    authLoading,
    isLoggedIn,
    searchParams,
    setPublishErrorMessage,
    setPublishOpen,
    setPublishSendFailed,
    setShowLoginModal,
  ]);

  useEffect(() => {
    if (!registerOpenPublish) return;
    const unregister = registerOpenPublish((trigger?: HTMLElement | null) => {
      if (trigger) setFocusReturn(trigger);
      if (authLoading) return;
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      setPublishSendFailed(false);
      setPublishErrorMessage(null);
      setPublishOpen(true);
    });
    return () => unregister();
  }, [
    authLoading,
    isLoggedIn,
    registerOpenPublish,
    setFocusReturn,
    setPublishErrorMessage,
    setPublishOpen,
    setPublishSendFailed,
    setShowLoginModal,
  ]);
}

/** `openPublish` 与抽屉关闭（焦点回退；须在 `useCommunityFeed` 内 **`useCommunityFeedTouchPullRefresh` 之后** 调用，以保持与其它 hook 的声明顺序）。 */
export function useCommunityFeedPublishOpenAndDrawerClosers(options: {
  authLoading: boolean;
  isLoggedIn: boolean;
  focusReturnTargetRef: MutableRefObject<HTMLElement | null>;
  setFocusReturn: (el: HTMLElement | null) => void;
  setShowLoginModal: Dispatch<SetStateAction<boolean>>;
  setPublishOpen: Dispatch<SetStateAction<boolean>>;
  setPublishSendFailed: Dispatch<SetStateAction<boolean>>;
  setPublishErrorMessage: Dispatch<SetStateAction<string | null>>;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
}) {
  const router = useRouter();
  const {
    authLoading,
    isLoggedIn,
    focusReturnTargetRef,
    setFocusReturn,
    setShowLoginModal,
    setPublishOpen,
    setPublishSendFailed,
    setPublishErrorMessage,
    setCommentPost,
    setDetailPost,
  } = options;

  /** SPA 切入 `/community` 后首帧常 `authLoading`；此前点发布会误开登录层而非抽屉。 */
  const pendingOpenAfterAuthRef = useRef(false);

  useEffect(() => {
    return () => {
      pendingOpenAfterAuthRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!pendingOpenAfterAuthRef.current) return;
    pendingOpenAfterAuthRef.current = false;
    if (isLoggedIn) {
      setPublishSendFailed(false);
      setPublishErrorMessage(null);
      setPublishOpen(true);
    } else {
      setShowLoginModal(true);
    }
  }, [
    authLoading,
    isLoggedIn,
    setPublishErrorMessage,
    setPublishOpen,
    setPublishSendFailed,
    setShowLoginModal,
  ]);

  const openPublish = useCallback(
    (trigger?: HTMLElement | null) => {
      if (trigger) setFocusReturn(trigger);
      if (authLoading) {
        pendingOpenAfterAuthRef.current = true;
        return;
      }
      if (isLoggedIn) {
        setPublishSendFailed(false);
        setPublishErrorMessage(null);
        setPublishOpen(true);
      } else setShowLoginModal(true);
    },
    [
      authLoading,
      isLoggedIn,
      setFocusReturn,
      setPublishErrorMessage,
      setPublishOpen,
      setPublishSendFailed,
      setShowLoginModal,
    ]
  );

  const closeCommentDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setCommentPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [focusReturnTargetRef, setCommentPost, setFocusReturn]);

  const closeDetailDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setDetailPost(null);
    requestAnimationFrame(() => prev?.focus());
  }, [focusReturnTargetRef, setDetailPost, setFocusReturn]);

  const closePublishDrawer = useCallback(() => {
    const prev = focusReturnTargetRef.current;
    setFocusReturn(null);
    setPublishOpen(false);
    setPublishSendFailed(false);
    setPublishErrorMessage(null);
    stripPublishQueryUsingRouter(router);
    requestAnimationFrame(() => prev?.focus());
  }, [
    focusReturnTargetRef,
    router,
    setFocusReturn,
    setPublishErrorMessage,
    setPublishOpen,
    setPublishSendFailed,
  ]);

  return {
    openPublish,
    closeCommentDrawer,
    closeDetailDrawer,
    closePublishDrawer,
  };
}
