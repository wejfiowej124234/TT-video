"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/** 社区抽屉/模态统一 portal 至 body，避免 Feed 列 stacking context 穿透 */
export function CommunityDrawerPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
