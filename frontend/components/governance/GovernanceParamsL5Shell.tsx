"use client";

import type { ReactNode } from "react";
import { GOV_PARAMS_L5, governanceParamsPageL5MainDataAttrs } from "@/lib/governance/governanceParamsPageL5";
import {
  GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE,
  GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER,
} from "@/lib/governance/governanceParamsPageL5ClosureSprintModel";

type Props = {
  children: ReactNode;
  ariaLabelledBy?: string;
  className?: string;
};

/** `/governance/params` · 深色 cinematic 页壳（同源首页 `/` + `/orders`） */
export function GovernanceParamsL5Shell({ children, ariaLabelledBy, className = "" }: Props) {
  return (
    <main
      className={`${GOV_PARAMS_L5.pageShell} ${className}`.trim()}
      {...governanceParamsPageL5MainDataAttrs()}
      data-tt-governance-params-closure-probe={GOVERNANCE_PARAMS_PAGE_L5_CLOSURE_PROBE}
      data-tt-ui-frozen={GOVERNANCE_PARAMS_PAGE_L5_FROZEN_MARKER}
      {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
    >
      <div className={GOV_PARAMS_L5.pageVignette} aria-hidden />
      <div className={GOV_PARAMS_L5.ambient} aria-hidden />
      <div className={GOV_PARAMS_L5.dotGrid} aria-hidden />
      <section className={GOV_PARAMS_L5.pageInnerNarrow}>{children}</section>
    </main>
  );
}
