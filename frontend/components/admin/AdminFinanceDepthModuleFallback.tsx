"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** FIN-02 · partial 深度参数缺失或未知模块时的引导。 */
export function AdminFinanceDepthModuleFallback() {
  const { t } = useTranslation();
  const moduleId = useSearchParams().get("fin_suite_module") ?? "";
  const depth = useSearchParams().get("fin_suite_depth");
  if (depth !== "partial" || !moduleId) return null;

  return (
    <section
      className="mb-4 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/50 p-4"
      data-tt-admin-fin-depth-module-fallback="1"
      data-tt-admin-fin-depth-unknown-module={moduleId}
      aria-label={t("admin_fin_depth_fallback_aria")}
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_depth_fallback_title")}</h2>
      <p className="mt-1 text-small text-ink-700">{t("admin_fin_depth_fallback_lead", { module: moduleId })}</p>
      <Link href="/admin/finance-suite" className={`mt-3 inline-block ${adminPageNavLinkClass()}`}>
        {t("admin_fin_depth_fallback_cta_suite")}
      </Link>
    </section>
  );
}
