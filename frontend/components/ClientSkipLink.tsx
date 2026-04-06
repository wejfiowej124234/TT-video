"use client";

import { useTranslation } from "@/components/LocaleProvider";

export default function ClientSkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main-content" className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:w-auto focus:h-auto focus:px-4 focus:py-2 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:rounded-[var(--radius-sm)] focus:bg-bg-console focus:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console focus:[clip:auto]">
      {t("common_skipToContent")}
    </a>
  );
}
