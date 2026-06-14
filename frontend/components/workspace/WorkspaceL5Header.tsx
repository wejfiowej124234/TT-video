"use client";

import { TT_WORKSPACE_L5 } from "@/lib/workspace/workspaceWorkbenchL5";

export function WorkspaceL5Header({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <header className={TT_WORKSPACE_L5.headerCard}>
      <p className={TT_WORKSPACE_L5.headerEyebrow}>{eyebrow}</p>
      <h1 className={`${TT_WORKSPACE_L5.headerTitle} mt-1`}>{title}</h1>
      <p className={TT_WORKSPACE_L5.headerSubtitle}>{subtitle}</p>
      {badge ? <div className="mt-3">{badge}</div> : null}
    </header>
  );
}
