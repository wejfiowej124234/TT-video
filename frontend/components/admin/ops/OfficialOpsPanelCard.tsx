"use client";

import type { ReactNode } from "react";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FILTER_TITLE_CLASS } from "@/lib/adminUi";

type Props = {
  title?: ReactNode;
  children: ReactNode;
  dataAttr?: string;
  className?: string;
  /** Legacy/extra data-* anchors (e.g. sprint probes). */
  dataAttrs?: Record<string, string>;
};

/** Official/Growth/Content ops · 暖金 L5 只读/操作面板（ADM-UX-VIS-09） */
export function OfficialOpsPanelCard({
  title,
  children,
  dataAttr,
  className = "",
  dataAttrs,
}: Props) {
  return (
    <section
      className={`mb-6 ${ADMIN_FILTER_CARD_CLASS} ${className}`.trim()}
      {...(dataAttr ? { "data-tt-admin-official-ops-panel": dataAttr } : {})}
      {...dataAttrs}
    >
      {title ? <h2 className={ADMIN_FILTER_TITLE_CLASS}>{title}</h2> : null}
      {children}
    </section>
  );
}
