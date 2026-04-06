"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

/** 打开发帖抽屉；可选传入触发元素，关闭时焦点还原到该元素（企业级 a11y） */
export type OpenPublishFn = (trigger?: HTMLElement | null) => void;

const CommunityPublishContext = createContext<{
  openPublish: (trigger?: HTMLElement | null) => void;
  registerOpenPublish: (fn: OpenPublishFn) => () => void;
} | null>(null);

/** 供 Layout 底部中央「发布」按钮打开发帖抽屉；Feed 页注册 openPublish，非 Feed 时跳转 /community?publish=1。
 * 不在 registerOpenPublish 内 setState，避免触发重渲染导致 context 引用变化、进而 useEffect 反复执行造成无限循环。 */
export function CommunityPublishProvider({ children }: { children: ReactNode }) {
  const openRef = useRef<OpenPublishFn | null>(null);

  const registerOpenPublish = useCallback((fn: OpenPublishFn) => {
    openRef.current = fn;
    return () => {
      openRef.current = null;
    };
  }, []);

  const openPublish = useCallback((trigger?: HTMLElement | null) => {
    openRef.current?.(trigger);
  }, []);

  const value = useMemo(() => ({ openPublish, registerOpenPublish }), [openPublish, registerOpenPublish]);

  return (
    <CommunityPublishContext.Provider value={value}>
      {children}
    </CommunityPublishContext.Provider>
  );
}

export function useCommunityPublish() {
  const ctx = useContext(CommunityPublishContext);
  return ctx;
}
