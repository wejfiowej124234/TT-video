"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 官网根路径地球仪首页：仅顶栏进度条，勿闪出旧行程表单壳 */
export default function HomeLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 right-0 z-[400] h-0.5 animate-pulse bg-travel-500"
      role="progressbar"
      aria-valuenow={undefined}
      aria-label={t("common_loading")}
      data-tt-traveltrust-route-loading-bar="1"
    />
  );
}
