"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 全站统一「加载中」文案，i18n；用于根 loading、Suspense fallback 等 */
export default function LoadingText({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={`text-ink-500 motion-sub animate-pulse ${className}`.trim()} role="status" aria-live="polite">
      {t("common_loading")}
    </p>
  );
}
