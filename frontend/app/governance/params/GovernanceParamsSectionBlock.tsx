"use client";

import type { ReactNode } from "react";
import { GOV_PARAMS_LAYOUT } from "@/lib/governance/governanceParamsPageL5Layout";

export function GovernanceParamsSectionBlock({
  id,
  kicker,
  title,
  lead,
  children,
  className = "",
  divider = false,
}: {
  id?: string;
  kicker?: string;
  title: string;
  lead?: string;
  children: ReactNode;
  className?: string;
  divider?: boolean;
}) {
  return (
    <section
      id={id}
      className={`${divider ? GOV_PARAMS_LAYOUT.blockDivider : ""} ${className}`.trim()}
      data-tt-governance-params-block={id ?? title}
    >
      {kicker ? <p className={GOV_PARAMS_LAYOUT.blockKicker}>{kicker}</p> : null}
      <h3 className={`${kicker ? "mt-1" : ""} ${GOV_PARAMS_LAYOUT.blockTitle}`.trim()}>{title}</h3>
      {lead ? <p className={GOV_PARAMS_LAYOUT.blockLead}>{lead}</p> : null}
      <div className={GOV_PARAMS_LAYOUT.blockGap}>{children}</div>
    </section>
  );
}

export function GovernanceParamsPanelHeader({
  title,
  lead,
  badge,
}: {
  title: string;
  lead?: string;
  badge?: string;
}) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={GOV_PARAMS_LAYOUT.panelTitle}>{title}</h2>
        {badge ? (
          <span className={GOV_PARAMS_LAYOUT.statusPill} role="status">
            {badge}
          </span>
        ) : null}
      </div>
      {lead ? <p className={GOV_PARAMS_LAYOUT.panelLead}>{lead}</p> : null}
    </header>
  );
}
