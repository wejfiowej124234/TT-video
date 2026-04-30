"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import MePageSkeleton from "@/components/me/MePageSkeleton";

/** `/guide` 工作台：`useSearchParams` 须在 Suspense 内（Next 15） */
function GuideDashboardRouteSuspenseFallback() {
  const { t } = useTranslation();
  return <MePageSkeleton t={t} ariaLabelKey="guide_dashboard_title" />;
}

export function GuideDashboardRouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<GuideDashboardRouteSuspenseFallback />}>{children}</Suspense>;
}
