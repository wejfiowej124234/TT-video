"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * App Router 全局 404；与 error 边界一致不向用户暴露内部细节；恢复链：首页 / 市场 / 订单 / 支付枢纽（13-1、04 §3.4 既有路径）。
 */
export default function NotFound() {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-12 bg-bg-main"
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
    >
      <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console p-6 shadow-soft text-center w-full">
        <p className="text-meta font-medium text-ink-500 mb-1">404</p>
        <h1 id={titleId} className="text-h4 font-semibold text-ink-900">
          {t("notFound_title")}
        </h1>
        <p className="mt-2 text-body text-ink-600">{t("notFound_description")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className={`rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-400 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            aria-label={t("common_backToHome")}
          >
            {t("common_backToHome")}
          </Link>
        </div>
        <ProductCrossNav
          ariaLabelKey="notFound_relatedNav_aria"
          showGuides
          className="mt-5 flex flex-wrap justify-center gap-x-2 gap-y-1 text-meta text-ink-600"
        />
      </div>
    </main>
  );
}
