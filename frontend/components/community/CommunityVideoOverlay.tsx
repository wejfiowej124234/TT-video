"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CommunityVideoOverlayView } from "@/components/community/CommunityVideoOverlayView";
import type { CommunityVideoOverlayProps } from "@/components/community/communityVideoOverlayTypes";

export type { CommunityVideoFeedItem } from "@/components/community/communityVideoOverlayTypes";

/** 小红书式竖屏 Feed 视频层：全屏 · 返回 · 竖滑切条 · 进度条 · Esc 关闭 */
export default function CommunityVideoOverlay(props: CommunityVideoOverlayProps) {
  const { open } = props;

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(<CommunityVideoOverlayView {...props} />, document.body);
}
