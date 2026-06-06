"use client";

import type { ReactNode } from "react";
import { TT_MARKETING_DID_RANK_SURFACE } from "@/lib/marketingUi";

/** 11～100：表头 + 列表随页面展开（无内层 max-height 滚动） */
export function DidRankFullRankList({
  ariaLabel,
  header,
  children,
  footer,
  listPanelRingClass = TT_MARKETING_DID_RANK_SURFACE.listPanelRingTraveler,
}: {
  ariaLabel: string;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  listPanelRingClass?: string;
}) {
  return (
    <div
      className={`${TT_MARKETING_DID_RANK_SURFACE.listPanel} ${listPanelRingClass}`}
      role="region"
      aria-label={ariaLabel}
    >
      <div className={TT_MARKETING_DID_RANK_SURFACE.rankListStickyHeader} role="presentation">
        {header}
      </div>
      <div role="list">{children}</div>
      {footer}
    </div>
  );
}
