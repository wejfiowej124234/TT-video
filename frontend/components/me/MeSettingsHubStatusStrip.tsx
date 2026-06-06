"use client";



import Link from "next/link";

import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";

import { meSecurityHref } from "@/lib/me/meSecurityL5";

import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";



const CHIP =

  "group flex min-h-[44px] flex-col justify-center rounded-xl border border-ref-sun/22 bg-ref-sun/[0.04] px-3 py-2 transition-colors motion-reduce:transition-none hover:border-ref-sun/40 hover:bg-ref-sun/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";



export function MeSettingsHubStatusStrip({

  t,

  loading,

  failed,

  activeSessionCount,

  walletVerified,

  emailVerified,

  onRetry,

}: {

  t: (key: string, vars?: Record<string, string | number>) => string;

  loading: boolean;

  failed: boolean;

  activeSessionCount: number | null;

  walletVerified: boolean | null;

  /** `false` = 注册未完成邮箱验证（少数补救）；`true`/`null` 不展示邮箱 chip */
  emailVerified?: boolean | null;

  onRetry: () => void;

}) {

  const sessionsLabel = failed

    ? t("me_settings_hub_status_failed")

    : activeSessionCount != null

      ? t("me_settings_hub_status_sessions", { n: activeSessionCount })

      : t("me_settings_hub_status_unknown");

  const walletLabel = failed

    ? t("me_settings_hub_status_failed")

    : walletVerified === true

      ? t("me_settings_hub_status_wallet_ok")

      : walletVerified === false

        ? t("me_settings_hub_status_wallet_pending")

        : t("me_settings_hub_status_unknown");

  const gridClass =
    emailVerified === false ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";

  return (

    <div className="space-y-2">

      <div

        className={`grid grid-cols-1 gap-2 ${gridClass}`}

        data-tt-me-settings-hub-status="1"
        {...(loading ? { "data-tt-me-settings-hub-status-loading": "1" } : {})}

        aria-label={t("me_settings_hub_status_aria")}

      >

        {emailVerified === false ? (
          <StatusChip
            href="/auth/verify-email?from=settings"
            iconId="bell"
            label={t("me_settings_hub_status_email_short")}
            value={loading ? t("me_settings_hub_status_loading") : t("me_settings_hub_status_email_unverified")}
            valueFailed={!loading}
            dataMarker="data-tt-me-settings-hub-status-email"
          />
        ) : null}

        <StatusChip

          href={meSecurityHref("sessions")}

          iconId="shield"

          label={t("me_settings_hub_status_sessions_short")}

          value={loading ? t("me_settings_hub_status_loading") : sessionsLabel}

          valueFailed={failed && !loading}

          dataMarker="data-tt-me-settings-hub-status-sessions"

        />

        <StatusChip

          href={meSecurityHref("wallet")}

          iconId="wallet"

          label={t("me_settings_item_wallet")}

          value={loading ? t("me_settings_hub_status_loading") : walletLabel}

          valueFailed={failed && !loading}

          dataMarker="data-tt-me-settings-hub-status-wallet"

        />

        <StatusChip

          href={meSecurityHref("notifications")}

          iconId="shield"

          label={t("me_settings_item_security_events")}

          value={t("me_settings_hub_status_notifications_cta")}

          valueFailed={false}

          dataMarker="data-tt-me-settings-hub-status-notifications"

        />

      </div>

      {failed && !loading ? (

        <p
          className="flex flex-wrap items-center gap-2 px-1 text-meta text-ref-coral/90"
          role="alert"
          data-tt-me-settings-hub-status-failed="1"
        >

          <span>{t("me_settings_hub_status_failed_hint")}</span>

          <button

            type="button"

            data-tt-me-settings-hub-status-retry="1"

            onClick={onRetry}

            className={`${touchTargetLink44Classes} inline text-ref-sun underline ${authL5InlineLinkFocusClasses}`}

          >

            {t("common_retry")}

          </button>

        </p>

      ) : null}

    </div>

  );

}



function StatusChip({

  href,

  iconId,

  label,

  value,

  valueFailed,

  dataMarker,

}: {

  href: string;

  iconId: string;

  label: string;

  value: string;

  valueFailed: boolean;

  dataMarker?: string;

}) {

  return (

    <Link href={href} className={CHIP} {...(dataMarker ? { [dataMarker]: "1" } : {})}>

      <span className="flex items-center gap-1.5 text-meta text-ref-sun/70">

        <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>

          <MeSettingsL5Icon id={iconId} />

        </span>

        <span className="font-medium">{label}</span>

      </span>

      <span

        className={`mt-0.5 line-clamp-2 text-small font-semibold group-hover:text-[#fde9a8] ${

          valueFailed ? "text-ref-coral/90" : "text-slate-100"

        }`}

      >

        {value}

      </span>

    </Link>

  );

}

