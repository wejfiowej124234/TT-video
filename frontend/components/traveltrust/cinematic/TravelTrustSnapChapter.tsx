"use client";

import type { ReactNode } from "react";
import {
  ttTraveltrustSnapChapterShellClass,
  traveltrustChapterViewportDataAttrs,
  traveltrustSnapChapterBeatDataAttrs,
} from "@/lib/traveltrust/l5";

export type TravelTrustSnapChapterId =
  | "theater"
  | "liquidity"
  | "trust"
  | "settlement"
  | "faq"
  | "close";

type Props = {
  /** 吸附章 id（与页内 nav `#liquidity` 等锚点一致） */
  chapterId: TravelTrustSnapChapterId;
  align?: "center" | "start";
  /** false = 按内容高度（FAQ 手风琴），不垫满一屏空白 */
  fillViewport?: boolean;
  children: ReactNode;
};

/** 多节合并为一屏吸附章（外壳 min-h 一屏 + 唯一 snap 点） */
export function TravelTrustSnapChapter({
  chapterId,
  align = "center",
  fillViewport = false,
  children,
}: Props) {
  return (
    <div
      className={ttTraveltrustSnapChapterShellClass({ align, fillViewport })}
      data-tt-traveltrust-snap-chapter={chapterId}
      data-tt-traveltrust-snap-align={align}
      data-tt-traveltrust-snap-chapter-l5="1"
      {...traveltrustChapterViewportDataAttrs()}
      {...traveltrustSnapChapterBeatDataAttrs(chapterId)}
    >
      {children}
    </div>
  );
}
