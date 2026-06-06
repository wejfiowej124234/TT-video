"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPlatformHubRelatedNav } from "@/components/admin/AdminPlatformHubRelatedNav";
import { CONFIG_HUB_LINKS, CONFIG_HUB_RELATED_FOLD_LINKS } from "./adminConfigHubPageModel";
import { useAdminConfigHubPage } from "./useAdminConfigHubPage";
import { ADMIN_HUB_LINK_CARD_INNER_CLASS, adminHubEntryLinkClass } from "@/lib/adminUi";

/** 220 / 70：配置中心导航台（子能力入口聚合；非完整键值治理 UI）。 */
export function AdminConfigHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } = useAdminConfigHubPage();

  return (
    <>
      <AdminPlatformHubRelatedNav
        currentLabelKey="admin_config_hub_title"
        relatedLinks={CONFIG_HUB_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_config_hub_related_aria"
        foldSummaryKey="admin_config_hub_related_fold"
        dataTtNav="config"
        dataTtFold="config"
      />
      <AdminDetailPageChrome
        titleId={pageTitleId}
        title={t("admin_config_hub_title")}
        subtitle={t("admin_config_hub_subtitle_l5")}
      >
        <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

        <AdminConfigPublishApprovalNotice />

        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={t("admin_config_hub_aria")}>
          {CONFIG_HUB_LINKS.map(({ href, titleKey, descKey }) => (
            <Link
              key={href}
              href={href}
              className={adminHubEntryLinkClass()}
              data-tt-admin-hub-link-card="1"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <h2 className="text-body-l font-medium">{t(titleKey)}</h2>
                <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
              </span>
            </Link>
          ))}
        </section>
      </AdminDetailPageChrome>
    </>
  );
}
