"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminChromeOpsInitSystemEntry } from "@/components/admin/AdminChromeOpsInitSystemEntry";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPlatformHubRelatedNav } from "@/components/admin/AdminPlatformHubRelatedNav";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import {
  CONFIG_HUB_MAINTAINER_LINKS,
  CONFIG_HUB_OPS_LINKS,
  CONFIG_HUB_RELATED_FOLD_LINKS,
} from "./adminConfigHubPageModel";
import { useAdminConfigHubPage } from "./useAdminConfigHubPage";
import {
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  ADMIN_META_BUILD_FOLD_CARD_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
  adminHubEntryLinkClass,
} from "@/lib/adminUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 220 / 70：平台设置 · 运营首屏 + 维护者折叠（B9-U4 · 非工程工作站）。 */
export function AdminConfigHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const actor = useAdminShellActor();
  const maintainerUi = isAdminMaintainerUi(actor.role);
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
        <AdminConfigPublishApprovalNotice />
        <p
          className={`mt-3 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}
          role="note"
          data-tt-admin-config-hub-writable-honesty="1"
        >
          {t("admin_config_hub_writable_honesty")}
        </p>

        <section
          className="mt-6 grid gap-4 sm:grid-cols-2"
          aria-label={t("admin_config_hub_aria")}
          data-tt-admin-config-hub-ops="1"
        >
          {CONFIG_HUB_OPS_LINKS.map(({ href, titleKey, descKey }) => (
            <Link
              key={href}
              href={href}
              className={adminHubEntryLinkClass()}
              data-tt-admin-hub-link-card="1"
            >
              <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                <h2 className="text-body-l font-medium">{t(titleKey)}</h2>
                <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(descKey)}</p>
              </span>
            </Link>
          ))}
        </section>

        <details
          className={`mt-6 ${ADMIN_META_BUILD_FOLD_CARD_CLASS} ${travelFocusRingCoreOffset2WhiteClasses}`}
          data-tt-admin-config-hub-maintainer-fold="1"
          data-tt-admin-config-hub-maintainer-default-open="0"
        >
          <summary
            className={`${touchTargetLink44Classes} cursor-pointer list-none text-body font-medium text-ink-800 marker:content-none [&::-webkit-details-marker]:hidden ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_config_hub_maintainer_fold")}
          </summary>
          <p className={`mt-2 text-small ${ADMIN_TEXT_META_CLASS}`}>{t("admin_config_hub_maintainer_hint")}</p>
          {/* HU-448 · 「初始化系统」仅维护折叠 · 二次确认 · 禁工作台主条 */}
          {maintainerUi ? (
            <div className="mt-3 flex flex-wrap gap-2" data-tt-admin-chrome-ops-init-slot="hu448">
              <AdminChromeOpsInitSystemEntry surface="config_maintainer" />
            </div>
          ) : null}
          <section
            className="mt-4 grid gap-4 sm:grid-cols-2"
            aria-label={t("admin_config_hub_maintainer_aria")}
          >
            {CONFIG_HUB_MAINTAINER_LINKS.map(({ href, titleKey, descKey }) => (
              <Link
                key={href}
                href={href}
                className={adminHubEntryLinkClass()}
                data-tt-admin-hub-link-card="1"
                data-tt-admin-config-hub-maintainer-card="1"
              >
                <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
                  <h2 className="text-body-l font-medium">{t(titleKey)}</h2>
                  <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t(descKey)}</p>
                </span>
              </Link>
            ))}
          </section>
          <div className="mt-4" data-tt-admin-config-hub-meta-build="1">
            <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />
          </div>
          {/* Batch-13 CF11 · Final Truth cite · 禁 HG/Cutover 解锁 CTA */}
          <aside
            className={`mt-4 rounded-[var(--radius-md)] border border-ink-200/50 px-3 py-2 text-small ${ADMIN_TEXT_META_CLASS}`}
            role="note"
            data-tt-admin-config-hub-truth-footer="1"
            data-tt-admin-config-hub-hard-gate="LOCKED"
            data-tt-admin-config-hub-cutover="LOCKED"
            data-tt-admin-config-hub-production-go="NO_GO"
          >
            <p className="font-medium text-ink-800">{t("admin_config_hub_truth_footer_title")}</p>
            <p className="mt-1">{t("admin_config_hub_truth_footer_body")}</p>
          </aside>
        </details>
      </AdminDetailPageChrome>
    </>
  );
}
