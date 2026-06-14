"use client";

import { useEffect } from "react";
import { StewardTtgStakeManagePanel } from "@/components/steward/StewardTtgStakeManagePanel";
import { STEWARD_WORKBENCH_STAKE_ANCHOR } from "@/lib/me/meIdentitiesCoreCardModel";
import type { StewardStakePanelCollapseMode } from "@/lib/governance/stewardWorkbenchWorkspaceL5";
import type { useStewardStakeManage } from "@/lib/steward/useStewardStakeManage";

export type StewardWorkbenchTtgStakeSectionProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  enabled: boolean;
  manage: ReturnType<typeof useStewardStakeManage>;
  /** 顶部门闸卡已含入驻 CTA 时隐藏面板内重复按钮 */
  hideGateCtas?: boolean;
  /** 顶部门闸：折叠面板，锚点 #steward-ttg-stake 展开 */
  gateCollapsed?: boolean;
  stakePanelCollapseMode?: StewardStakePanelCollapseMode;
  /** need_stake 顶部门闸：紧凑质押区（隐藏双轨瓦片/生命周期冗长块） */
  gateStakeCompact?: boolean;
  /** 顶区 satisfied 细条已展示双轨摘要 */
  hideDualTrackSummary?: boolean;
  hideAdmissionDisclosure?: boolean;
};

/** 主理人 TTG Seat 质押 · 工作台唯一操作面（R1 · L2） */
export default function StewardWorkbenchTtgStakeSection({
  t,
  enabled,
  manage,
  hideGateCtas = false,
  gateCollapsed = false,
  stakePanelCollapseMode = "none",
  gateStakeCompact = false,
  hideDualTrackSummary = false,
  hideAdmissionDisclosure = false,
}: StewardWorkbenchTtgStakeSectionProps) {

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.location.hash !== `#${STEWARD_WORKBENCH_STAKE_ANCHOR}`) return;
    const el = document.getElementById(STEWARD_WORKBENCH_STAKE_ANCHOR);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [enabled]);

  return (
    <div id={STEWARD_WORKBENCH_STAKE_ANCHOR} className="scroll-mt-24">
      <StewardTtgStakeManagePanel
        t={t}
        manage={manage}
        variant="workbench"
        hideGateCtas={hideGateCtas}
        gateCollapsed={gateCollapsed}
        stakePanelCollapseMode={stakePanelCollapseMode}
        gateStakeCompact={gateStakeCompact}
        hideDualTrackSummary={hideDualTrackSummary}
        hideAdmissionDisclosure={hideAdmissionDisclosure}
      />
    </div>
  );
}
