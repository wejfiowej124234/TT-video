"use client";

import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";

export default function AdminGuideDetailLoading() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
        {t("admin_guide_detail_title")}
      </h1>
      <p className="mt-6 text-body text-ink-500" role="status">
        {t("admin_loading")}
      </p>
    </main>
  );
}
