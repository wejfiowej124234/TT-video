import type { ReactNode } from "react";

export { GOV_PROPOSALS_L5, governanceProposalsL5MainDataAttrs } from "@/lib/governance/governanceProposalsListL5";

import { GOV_PROPOSALS_L5 } from "@/lib/governance/governanceProposalsListL5";

/** 暖金外框 + 深色玻璃内胆（同源 `/orders` 列表卡片） */
export function GovernanceProposalsL5Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${GOV_PROPOSALS_L5.panelFrame} ${className}`.trim()}>
      <div className={GOV_PROPOSALS_L5.panelInner}>
        <div className={GOV_PROPOSALS_L5.panelGlow} aria-hidden />
        <div className={GOV_PROPOSALS_L5.panelBody}>{children}</div>
      </div>
    </div>
  );
}
