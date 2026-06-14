"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PES_UI } from "@/lib/productEnhancementSprint";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

export type TouchpointEmptyAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export type TouchpointEmptyPanelProps = {
  title: string;
  body?: string;
  actions?: TouchpointEmptyAction[];
  footer?: ReactNode;
  variant?: "dark" | "light";
  className?: string;
};

/** 统一空态：标题 + 说明 + 44px 触控 CTA */
export function TouchpointEmptyPanel({
  title,
  body,
  actions = [],
  footer,
  variant = "dark",
  className = "",
}: TouchpointEmptyPanelProps) {
  const shell =
    variant === "light"
      ? "rounded-[var(--radius-md)] border border-ink-200/80 bg-ink-50/60 p-4 dark:border-ink-600/40 dark:bg-ink-900/30"
      : PES_UI.emptyPanel;
  const titleCls =
    variant === "light"
      ? "text-small font-semibold text-ink-800 dark:text-ink-100"
      : PES_UI.emptyTitle;
  const bodyCls =
    variant === "light" ? "mt-2 text-body text-ink-700 dark:text-ink-200" : PES_UI.emptyBody;

  return (
    <section className={`${shell} ${className}`} aria-label={title} data-tt-pes-empty="1">
      <h2 className={titleCls}>{title}</h2>
      {body ? <p className={bodyCls}>{body}</p> : null}
      {actions.length > 0 ? (
        <div className={PES_UI.emptyActions}>
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={`${a.primary ? PES_UI.ctaPrimary : PES_UI.ctaSecondary} ${travelFocusRingCoreOffset2Classes}`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
