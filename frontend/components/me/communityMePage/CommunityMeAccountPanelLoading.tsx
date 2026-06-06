"use client";

import { TT_COMMUNITY_ME_PANEL_L5 } from "@/lib/marketingUi";

/** 社区「我的」资料卡加载骨架（与 `CommunityMeAccountPanel` 同视觉） */
export default function CommunityMeAccountPanelLoading() {
  return (
    <div
      className={TT_COMMUNITY_ME_PANEL_L5.loadingPulse}
      aria-busy="true"
    >
      <div className="h-5 w-32 bg-ink-600/50 rounded-[var(--radius-sm)] mb-4" />
      <div className="h-24 bg-ink-700/40 rounded-[var(--radius-md)]" />
    </div>
  );
}
