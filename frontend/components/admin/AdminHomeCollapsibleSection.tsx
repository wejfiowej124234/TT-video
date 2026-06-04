"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  readAdminHomeSectionOpen,
  writeAdminHomeSectionOpen,
} from "@/lib/admin/adminHomeSectionPersist";
import { ADMIN_MOTION_CARD_HOVER_CLASS, ADMIN_PENDING_COUNT_BADGE_CLASS } from "@/lib/adminUi";

/** 首页功能区分组折叠（有待办默认展开；localStorage 记忆展开态）。 */
export function AdminHomeCollapsibleSection(props: {
  sectionId: string;
  titleKey: string;
  defaultOpen?: boolean;
  badge?: string | null;
  collapsedSummaryKey?: string | null;
  collapsedSummaryVars?: Record<string, string | number>;
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
    children,
  } = props;

  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(readAdminHomeSectionOpen(sectionId, defaultOpen));
  }, [sectionId, defaultOpen]);

  const summaryLine =
    collapsedSummaryKey && !open ? t(collapsedSummaryKey, collapsedSummaryVars) : null;

  return (
    <details
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(next);
        writeAdminHomeSectionOpen(sectionId, next);
      }}
      className="group rounded-[var(--radius-xl)] border border-ink-200 bg-white shadow-soft"
      data-tt-admin-home-section={sectionId}
      data-tt-admin-home-section-persist="1"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-1 px-4 py-3 marker:content-none sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 group-open:rotate-90 ${ADMIN_MOTION_CARD_HOVER_CLASS}`}
            aria-hidden
          >
            ›
          </span>
          <span className="text-body font-semibold text-ink-900">{t(titleKey)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
          {summaryLine ? (
            <span
              className="text-meta text-ink-500 group-open:hidden"
              data-tt-admin-home-section-summary={sectionId}
            >
              {summaryLine}
            </span>
          ) : null}
          {badge ? <span className={ADMIN_PENDING_COUNT_BADGE_CLASS}>{badge}</span> : null}
        </span>
      </summary>
      <div className="border-t border-ink-100 px-4 pb-4 pt-3">{children}</div>
    </details>
  );
}
