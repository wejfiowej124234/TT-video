"use client";

import { useEffect, useState } from "react";
import { AUTH_SESSION_TOKEN_KEY, AUTH_USER_ID_KEY } from "@/lib/apiClient/core";

/** 当前浏览者 user id；SSR/首屏 hydration 返回空串，mount 后再读 localStorage。 */
export function useViewerUserId(): string {
  const [viewerUserId, setViewerUserId] = useState("");

  useEffect(() => {
    const read = () => {
      setViewerUserId(localStorage.getItem(AUTH_USER_ID_KEY)?.trim() ?? "");
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_USER_ID_KEY || e.key === AUTH_SESSION_TOKEN_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return viewerUserId;
}
