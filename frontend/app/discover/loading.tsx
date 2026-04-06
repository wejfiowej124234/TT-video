"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * Discover 路由 loading：与根 loading 一致，切换进 Discover 时立即显示；52 §7.5 满分；30 §5 i18n common_loading。
 */
export default function DiscoverLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="fixed left-0 top-0 right-0 z-[400] h-0.5 bg-travel-500 animate-pulse"
      role="progressbar"
      aria-valuenow={undefined}
      aria-label={t("common_loading") || "Loading"}
    />
  );
}
