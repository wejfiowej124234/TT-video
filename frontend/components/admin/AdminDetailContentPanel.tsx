"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

type Props<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  pad?: "default" | "none";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** ① 详情/处置主内容块 · 暖金 L5（非 `ADMIN_FILTER_CARD` 筛选纯白卡）。 */
export function AdminDetailContentPanel<T extends ElementType = "div">({
  as,
  children,
  className = "",
  pad = "default",
  ...rest
}: Props<T>) {
  return (
    <AdminWarmL5Surface
      as={as}
      className={className}
      pad={pad}
      data-tt-admin-detail-content-panel="1"
      {...rest}
    >
      {children}
    </AdminWarmL5Surface>
  );
}
