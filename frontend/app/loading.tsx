"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * 根路由 loading：切换页面时立即显示，减轻「点击无反应」体感。
 * 与 Header useNavigatingBar 风格一致（顶栏短进度条）；52 §7.5 P0；30 §5 i18n common_loading。
 */
export default function Loading() {
  const { t } = useTranslation();
  return (
    <div
      className="fixed left-0 top-0 right-0 z-[400] h-0.5 bg-travel-500 animate-pulse"
      role="progressbar"
      aria-valuenow={undefined}
      aria-label={t("common_loading")}
    />
  );
}
