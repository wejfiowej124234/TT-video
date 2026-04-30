"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** `/network` → `/traveltrust` 重定向前瞬时反馈；与 `discover/loading` 同口径 */
export default function NetworkAliasLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="fixed left-0 top-0 right-0 z-[400] h-0.5 bg-travel-500 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("common_loading")}
    />
  );
}
