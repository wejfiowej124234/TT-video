"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  pad?: "default" | "none";
} & Omit<ComponentPropsWithoutRef<"div">, "as" | "className" | "children">;

/** ① 详情/处置主内容块 · 暖金 L5（非 `ADMIN_FILTER_CARD` 筛选纯白卡）。 */
export function AdminDetailContentPanel({
  as,
  children,
  className = "",
  pad = "default",
  ...rest
}: Props) {
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
