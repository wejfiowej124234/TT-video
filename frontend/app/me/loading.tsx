"use client";

import MePageSkeleton from "@/components/me/MePageSkeleton";
import { useTranslation } from "@/components/LocaleProvider";

/** 与 Me 页内骨架一致（背景 + 玻璃卡片），避免路由级与页内两套 UI */
export default function MeLoading() {
  const { t } = useTranslation();
  return <MePageSkeleton t={t} />;
}
