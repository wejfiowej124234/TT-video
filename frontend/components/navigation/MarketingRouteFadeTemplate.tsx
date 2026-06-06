"use client";

import type { ReactNode } from "react";

/**
 * 五主路由切换：仅 opacity 淡入（150–180ms），不改布局/色系。
 * 配合各段 `template.tsx`；`prefers-reduced-motion` 在 globals.css 关闭动画。
 */
export function MarketingRouteFadeTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="tt-marketing-route-fade-in min-h-0" data-tt-marketing-route-fade="1">
      {children}
    </div>
  );
}
