"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

const CONFIG_HUB_LINKS: { href: string; titleKey: string; descKey: string }[] = [
  { href: "/admin/flags", titleKey: "admin_flags_title", descKey: "admin_config_hub_desc_flags" },
  { href: "/admin/secrets/metadata", titleKey: "admin_secrets_meta_title", descKey: "admin_config_hub_desc_secrets" },
  { href: "/admin/config/releases", titleKey: "admin_config_releases_title", descKey: "admin_config_hub_desc_releases" },
  { href: "/admin/jobs", titleKey: "admin_jobs_title", descKey: "admin_config_hub_desc_jobs" },
  { href: "/admin/approvals", titleKey: "admin_approvals_title", descKey: "admin_config_hub_desc_approvals" },
];

/** 220 / 70：配置中心导航台（子能力入口聚合；非完整键值治理 UI）。 */
export default function AdminConfigHubPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminConfigHubMetaBuild");

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_config_hub_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_config_hub_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_config_hub_back_admin")}
          </Link>
        </div>
      </header>

      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={t("admin_config_hub_aria")}>
        {CONFIG_HUB_LINKS.map(({ href, titleKey, descKey }) => (
          <Link
            key={href}
            href={href}
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            <h2 className="text-body-l font-medium">{t(titleKey)}</h2>
            <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
