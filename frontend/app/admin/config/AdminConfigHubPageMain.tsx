"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminConfigPublishApprovalNotice } from "@/components/admin/AdminConfigPublishApprovalNotice";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { CONFIG_HUB_LINKS } from "./adminConfigHubPageModel";
import { useAdminConfigHubPage } from "./useAdminConfigHubPage";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
/** 220 / 70：配置中心导航台（子能力入口聚合；非完整键值治理 UI）。 */
export function AdminConfigHubPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const { meta: buildMeta, loading: buildLoading, error: buildError } = useAdminConfigHubPage();

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_config_hub_title")}
      subtitle={t("admin_config_hub_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_config_hub_back_admin")}
          </Link>
        </>
      }
    >
      <AdminMetaBuildSection meta={buildMeta} loading={buildLoading} error={buildError} />

      <AdminConfigPublishApprovalNotice />

      <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={t("admin_config_hub_aria")}>
        {CONFIG_HUB_LINKS.map(({ href, titleKey, descKey }) => (
          <Link
            key={href}
            href={href}
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            <h2 className="text-body-l font-medium">{t(titleKey)}</h2>
            <p className="mt-1 text-small text-ink-600">{t(descKey)}</p>
          </Link>
        ))}
      </section>
    </AdminDetailPageChrome>
  );
}
