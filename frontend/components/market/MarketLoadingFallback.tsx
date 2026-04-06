"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 自由市场 layout Suspense fallback：与市场页深色背景一致的「加载中」文案，i18n */
export default function MarketLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <p className="text-body text-white/90 drop-shadow-on-dark">{t("common_loading")}</p>
    </div>
  );
}
