"use client";

import type { ReactNode } from "react";
import { CIM, CIM_FOCUS } from "./customItineraryModalTheme";

export default function CustomItineraryCollapsibleDayShell({
  collapsible,
  defaultOpen,
  summary,
  stepLabel,
  children,
}: {
  collapsible: boolean;
  defaultOpen: boolean;
  summary: string;
  stepLabel?: string;
  children: ReactNode;
}) {
  const body = <div className="space-y-4">{children}</div>;

  if (!collapsible) {
    return (
      <div className={CIM.customItineraryPanelDay}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="text-small font-semibold text-white drop-shadow-market-pill">{summary}</h3>
          {stepLabel ? <span className="text-meta text-ref-sun/90">{stepLabel}</span> : null}
        </div>
        {body}
      </div>
    );
  }

  return (
    <details open={defaultOpen} className={`${CIM.customItineraryPanelDay} group`}>
      <summary
        className={`flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 marker:content-none ${CIM_FOCUS} rounded-[var(--radius-sm)]`}
      >
        <span className="text-small font-semibold text-white drop-shadow-market-pill">{summary}</span>
        <span className="flex items-center gap-2 text-meta text-ref-sun/90">
          {stepLabel}
          <span className="text-white/50 group-open:rotate-180 transition-transform" aria-hidden>
            ▾
          </span>
        </span>
      </summary>
      <div className="mt-3">{body}</div>
    </details>
  );
}
