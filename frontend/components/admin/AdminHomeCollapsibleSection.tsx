"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  readAdminHomeSectionOpen,
  writeAdminHomeSectionOpen,
} from "@/lib/admin/adminHomeSectionPersist";
import {
  ADMIN_WARM_L5_FRAME_CLASS,
  ADMIN_WARM_L5_INNER_CLASS,
  ADMIN_WARM_L5_PAD_CLASS,
  ADMIN_COLLAPSE_CHEVRON_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_PENDING_COUNT_BADGE_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_KPI_EMBEDDED_FOLD_SUMMARY_CLASS,
  ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS,
} from "@/lib/adminUi";

/** 首页功能区分组折叠（有待办默认展开；localStorage 记忆展开态）。 */
export function AdminHomeCollapsibleSection(props: {
  sectionId: string;
  titleKey: string;
  defaultOpen?: boolean;
  badge?: string | null;
  collapsedSummaryKey?: string | null;
  collapsedSummaryVars?: Record<string, string | number>;
  /** embedded KPI 等 · summary 左 accent 配重 */
  summaryAccent?: boolean;
  /** warm = 暖金满框；compact = 聚焦待办轻框 */
  frame?: "warm" | "compact";
  /** false 时不读写 localStorage（聚焦策略默认收起时避免旧「展开」覆盖） */
  persistOpen?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const {
    sectionId,
    titleKey,
    defaultOpen = false,
    badge,
    collapsedSummaryKey,
    collapsedSummaryVars,
    summaryAccent = false,
    frame = "warm",
    persistOpen = true,
    children,
  } = props;

  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!persistOpen) {
      setOpen(defaultOpen);
      return;
    }
    setOpen(readAdminHomeSectionOpen(sectionId, defaultOpen));
  }, [sectionId, defaultOpen, persistOpen]);

  const summaryLine =
    collapsedSummaryKey && !open ? t(collapsedSummaryKey, collapsedSummaryVars) : null;

  const frameClass = frame === "compact" ? ADMIN_HOME_SECTION_COMPACT_FRAME_CLASS : ADMIN_WARM_L5_FRAME_CLASS;
  const summaryPad = frame === "compact" ? "px-3 py-2.5" : ADMIN_WARM_L5_PAD_CLASS;
  const bodyInner = frame === "compact" ? "px-3 pb-3 pt-2" : `${ADMIN_WARM_L5_INNER_CLASS} px-4 pb-4 pt-3`;

  return (
    <details
      id={sectionId}
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(next);
        if (persistOpen) writeAdminHomeSectionOpen(sectionId, next);
      }}
      className={`group ${frameClass}`}
      data-tt-admin-home-section={sectionId}
      data-tt-admin-home-section-persist="1"
      data-tt-admin-home-section-frame={frame}
    >
      <summary
        className={`flex cursor-pointer list-none flex-col gap-1 ${frame === "compact" ? "" : ADMIN_WARM_L5_INNER_CLASS} ${summaryPad} marker:content-none sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${summaryAccent ? ADMIN_KPI_EMBEDDED_FOLD_SUMMARY_CLASS : ""}`}>
          <span
            className={`${ADMIN_COLLAPSE_CHEVRON_CLASS} group-open:rotate-90 ${ADMIN_MOTION_CARD_HOVER_CLASS}`}
            aria-hidden
          >
            ›
          </span>
          <span className={`text-body font-semibold ${ADMIN_TEXT_BODY_CLASS}`}>{t(titleKey)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
          {summaryLine ? (
            <span
              className={`text-small ${ADMIN_TEXT_META_CLASS} group-open:hidden`}
              data-tt-admin-home-section-summary={sectionId}
            >
              {summaryLine}
            </span>
          ) : null}
          {badge ? <span className={ADMIN_PENDING_COUNT_BADGE_CLASS}>{badge}</span> : null}
        </span>
      </summary>
      <div className={`${frame === "compact" ? "border-t border-white/8" : "border-t border-ref-sun/15"} ${bodyInner}`}>{children}</div>
    </details>
  );
}
