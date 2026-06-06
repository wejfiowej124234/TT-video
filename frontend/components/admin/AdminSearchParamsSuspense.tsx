"use client";

import { Suspense, type ReactNode } from "react";

import AdminRouteSegmentLoading from "@/components/admin/AdminRouteSegmentLoading";

/** Next 15：`useSearchParams` / `useParams` 须在 Suspense 边界内（07 §5.6C / 70） */
export function AdminSearchParamsSuspense({
  ariaLabelKey,
  children,
}: {
  /** 与同页主标题 `t("…")` 键一致，供 fallback 可访问名 */
  ariaLabelKey: string;
  /** @deprecated 切页已统一轻量 segment loading；首屏冷启动由 AdminMainBootGate 承担 */
  loadingVariant?: never;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={<AdminRouteSegmentLoading mainAriaLabelKey={ariaLabelKey} />}
    >
      {children}
    </Suspense>
  );
}
