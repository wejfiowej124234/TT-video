import type { ReactNode } from "react";

import { GUIDE_DETAIL_SECTION_HEADING_META_CLASS } from "./guideDetailPageConstants";

export function GuideDetailCredentialCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[var(--radius-md)] border border-slate-600/50 bg-ink-700/50 p-4 ${className}`}>
      <h4 className={GUIDE_DETAIL_SECTION_HEADING_META_CLASS}>{title}</h4>
      {children}
    </div>
  );
}
