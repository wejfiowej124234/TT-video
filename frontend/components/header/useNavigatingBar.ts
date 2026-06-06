"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const NAV_BAR_DURATION_MS = 50;

/** 顶栏进度条：pointerdown 即显示，路由变更后约 50ms 隐藏（与切页目标一致） */
export function useNavigatingBar(pathname: string | null) {
  const [show, setShow] = useState(false);
  const prev = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBar = useCallback(() => {
    setShow(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setShow(false);
    }, NAV_BAR_DURATION_MS);
  }, []);

  useEffect(() => {
    if (pathname !== prev.current) {
      prev.current = pathname;
      showBar();
    }
  }, [pathname, showBar]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { show, onNavStart: showBar };
}
