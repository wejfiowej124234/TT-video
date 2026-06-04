"use client";

import type { ReactNode } from "react";

import {
  ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS,
  ADMIN_APPLIED_FILTERS_BANNER_INLINE_CLASS,
  ADMIN_APPLIED_FILTERS_BANNER_PANEL_CLASS,
} from "@/lib/adminUi";

export type AdminAppliedFiltersBannerVariant = "card" | "inline" | "panel";

const VARIANT_CLASS: Record<AdminAppliedFiltersBannerVariant, string> = {
  card: ADMIN_APPLIED_FILTERS_BANNER_CARD_CLASS,
  inline: ADMIN_APPLIED_FILTERS_BANNER_INLINE_CLASS,
  panel: ADMIN_APPLIED_FILTERS_BANNER_PANEL_CLASS,
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
      data-tt-admin-applied-filters="1"
      data-tt-admin-applied-filters-variant={variant}
    >
      {children}
    </p>
  );
}
