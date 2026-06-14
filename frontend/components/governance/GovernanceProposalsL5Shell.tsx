"use client";

import type { ReactNode } from "react";
import {
  GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE,
  GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER,
} from "@/lib/governance/governanceProposalsL5ClosureSprintModel";
import {
  GOV_PROPOSALS_L5,
  governanceProposalsL5MainDataAttrs,
} from "@/lib/governance/governanceProposalsListL5";

type Props = {
  children: ReactNode;
  /** list = max-w-5xl · detail/create = max-w-3xl */
  width?: "list" | "narrow";
  /** 机读页标识（contract test） */
  pageKind?: "list" | "detail" | "create";
  ariaLabelledBy?: string;
  className?: string;
};

/** `/governance/proposals*` · 深色 cinematic 页壳（同源 `/` + `/orders`） */
export function GovernanceProposalsL5Shell({
  children,
  width = "list",
  pageKind = "list",
  ariaLabelledBy,
  className = "",
}: Props) {
  const innerClass = width === "narrow" ? GOV_PROPOSALS_L5.pageInnerNarrow : GOV_PROPOSALS_L5.pageInner;

  return (
    <main
      className={`${GOV_PROPOSALS_L5.pageShell} ${className}`.trim()}
      {...governanceProposalsL5MainDataAttrs()}
      {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
      data-tt-governance-proposals-page="1"
      data-tt-ui-frozen={GOVERNANCE_PROPOSALS_L5_FROZEN_MARKER}
      data-tt-governance-proposals-closure-probe={GOVERNANCE_PROPOSALS_L5_CLOSURE_PROBE}
      {...(pageKind === "detail" ? { "data-tt-governance-proposal-detail-page": "1" } : {})}
      {...(pageKind === "create" ? { "data-tt-governance-proposal-create-page": "1" } : {})}
    >
      <div className={GOV_PROPOSALS_L5.pageVignette} aria-hidden />
      <div className={GOV_PROPOSALS_L5.ambient} aria-hidden />
      <div className={GOV_PROPOSALS_L5.dotGrid} aria-hidden />
      <section className={innerClass}>{children}</section>
    </main>
  );
}
