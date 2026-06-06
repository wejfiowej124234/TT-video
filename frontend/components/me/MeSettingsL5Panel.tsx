"use client";

import type { ReactNode } from "react";
import { TT_ME_SECURITY_L5 } from "@/lib/me/meSecurityL5";

export function MeSettingsL5Panel({
  id,
  title,
  actions,
  children,
}: {
  id: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={TT_ME_SECURITY_L5.panel}
      data-tt-me-security-panel={id}
    >
      <div className={TT_ME_SECURITY_L5.panelHeader}>
        <h2 className={TT_ME_SECURITY_L5.panelTitle}>{title}</h2>
        {actions ? <div className={TT_ME_SECURITY_L5.panelToolbar}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
