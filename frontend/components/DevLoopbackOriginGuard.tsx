"use client";

import { useEffect } from "react";
import { resolveDevLoopbackOriginRedirect } from "@/lib/devLoopbackOrigin";

/** 开发态：消除 localhost / 127.0.0.1 混用（含 IDE Simple Browser iframe）。 */
export function DevLoopbackOriginGuard() {
  useEffect(() => {
    const next = resolveDevLoopbackOriginRedirect(window.location.href);
    if (next) window.location.replace(next);
  }, []);
  return null;
}
