"use client";

import MePageSkeleton from "@/components/me/MePageSkeleton";
import { useTranslation } from "@/components/LocaleProvider";

/** 与 `/me` 同构骨架；向导工作台首屏异步前即时反馈 */
export default function GuideLoading() {
  const { t } = useTranslation();
  return <MePageSkeleton t={t} ariaLabelKey="guide_dashboard_title" />;
}
