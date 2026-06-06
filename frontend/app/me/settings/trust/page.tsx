"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsL5Row } from "@/components/me/MeSettingsL5Row";
import { MeSettingsResendVerifyEmailPanel } from "@/components/me/MeSettingsResendVerifyEmailPanel";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import { isMeEmailVerified } from "@/lib/me/meSettingsUser";
import { meSettingsNavExtensionHref } from "@/lib/me/meSettingsExtensionContext";
import { meSecurityHref } from "@/lib/me/meSecurityL5";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** 信任与钱包（L5）· 信任中心 + 钱包验证；不含 KYC（Web3 旅行者主路径不强调链下 KYC） */
export default function MeSettingsTrustPage() {
  const { t } = useTranslation();
  const { user, loading, error, reload } = useMeSettingsSummary(t);
  const emailOk = isMeEmailVerified(user);
  const soonLabel = t("me_settings_badge_soon");

  const actionRows = [
    {
      id: "trust_center",
      iconId: "trust",
      labelKey: "trust_nav_short",
      descKey: "me_settings_trust_desc_center",
      href: meSettingsNavExtensionHref("/trust"),
    },
    {
      id: "wallet",
      iconId: "wallet",
      labelKey: "me_settings_item_wallet",
      descKey: "me_settings_desc_wallet_verify",
      href: meSecurityHref("wallet"),
    },
    {
      id: "security",
      iconId: "shield",
      labelKey: "me_security_center",
      descKey: "me_settings_desc_security",
      href: "/me/security",
    },
  ] as const;

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("me_settings_trust_page_title")}
      route="settings-trust"
      dataAttrs={{
        "data-tt-me-settings-route": "settings-trust",
        "data-tt-me-settings-trust": "1",
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <MeSettingsSubpageHeader
        t={t}
        eyebrowKey="me_settings_section_account_security"
        titleKey="me_settings_trust_page_title"
        subtitleKey="me_settings_trust_subtitle_wallet"
      />

      {loading ? <p className="text-meta text-slate-400/90">{t("common_loading")}</p> : null}

      {!loading && error ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {error}{" "}
          <button
            type="button"
            className={`text-ref-sun underline ${authL5InlineLinkFocusClasses}`}
            onClick={() => reload()}
          >
            {t("common_retry")}
          </button>
        </p>
      ) : null}

      {!loading && user && !emailOk ? (
        <MeSettingsResendVerifyEmailPanel />
      ) : null}

      <section className={TT_ME_SETTINGS_L5.section}>
        <h2 className={TT_ME_SETTINGS_L5.sectionTitle}>{t("me_settings_trust_actions_section")}</h2>
        <ul className={TT_ME_SETTINGS_L5.sectionCard} role="list">
          {actionRows.map((row) => (
            <li key={row.id} className="list-none">
              <MeSettingsL5Row
                item={{
                  id: row.id,
                  iconId: row.iconId,
                  labelKey: row.labelKey,
                  descKey: row.descKey,
                  href: row.href,
                }}
                label={t(row.labelKey)}
                desc={t(row.descKey)}
                soonLabel={soonLabel}
              />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-meta text-slate-500/90">
        <Link
          href="/me/settings"
          className={`text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
        >
          {t("me_settings_back_hub")}
        </Link>
      </p>
    </MeSettingsL5FlowPage>
  );
}
