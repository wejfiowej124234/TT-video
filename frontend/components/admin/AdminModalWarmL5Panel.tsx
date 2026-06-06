"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

type Props = {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">;

/** ① Admin 模态/抽屉 · 暖金 L5 玻璃壳（同源 `/` · 非裸 `bg-bg-console` 方盒）。 */
export function AdminModalWarmL5Panel({ children, className = "max-w-md w-full", ...rest }: Props) {
  return (
    <AdminWarmL5Surface
      className={`relative z-10 shadow-medium ${className}`.trim()}
      pad="default"
      data-tt-admin-modal-warm-l5="1"
      {...rest}
    >
      {children}
    </AdminWarmL5Surface>
  );
}
