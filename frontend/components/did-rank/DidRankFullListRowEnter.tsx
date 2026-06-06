"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/** 11+ 展开时行级 opacity stagger（无位移，避免列表文字发糊） */
export function DidRankFullListRowEnter({
  rowIndex,
  enterKey,
  children,
}: {
  rowIndex: number;
  /** 展开代次 + 分页页码等；空则跳过动画 */
  enterKey: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || !enterKey) return <>{children}</>;

  const delay = Math.min(rowIndex, 24) * 0.04;

  return (
    <div
      key={`did-rank-row-enter-${enterKey}-${rowIndex}`}
      className="animate-did-rank-row-enter motion-reduce:animate-none"
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
