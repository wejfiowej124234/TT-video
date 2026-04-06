"use client";

import type { ReactNode } from "react";

export type AdminAppliedFiltersBannerVariant = "card" | "inline" | "panel";

const VARIANT_CLASS: Record<AdminAppliedFiltersBannerVariant, string> = {
  card: "mt-3 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 p-3 text-small text-ink-700",
  inline: "text-meta text-ink-500 font-mono break-all",
  panel: "text-small text-ink-700 rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 p-3",
};

/** Echo of `applied_filters` on admin list pages; not a navigation control. */
export function AdminAppliedFiltersBanner({
  variant = "card",
  className,
  id,
  children,
}: {
  variant?: AdminAppliedFiltersBannerVariant;
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  const base = VARIANT_CLASS[variant];
  return (
    <p
      id={id}
      className={className ? `${base} ${className}` : base}
      role="status"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
