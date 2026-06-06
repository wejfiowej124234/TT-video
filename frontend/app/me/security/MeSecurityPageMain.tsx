"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MeSecurityNotificationsSection } from "./MeSecurityNotificationsSection";
import { MeSecuritySessionsSection } from "./MeSecuritySessionsSection";
import { MeSecurityWalletVerifySection } from "./MeSecurityWalletVerifySection";
import { parseMeSecurityFocus, useMeSecurityFocusScroll } from "./useMeSecurityFocusScroll";
import { useMeSecurityPage } from "./useMeSecurityPage";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsL5ConfirmDialog } from "@/components/me/MeSettingsL5ConfirmDialog";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { TT_ME_SECURITY_L5 } from "@/lib/me/meSecurityL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

export function MeSecurityPageMain() {
  const vm = useMeSecurityPage();
  const searchParams = useSearchParams();
  const focus = parseMeSecurityFocus(searchParams?.get("focus") ?? null);
  useMeSecurityFocusScroll(focus);

  return (
    <MeSettingsL5FlowPage
      aria-labelledby={vm.mainTitleId}
      route="security"
      dataAttrs={{
        "data-tt-me-security-page": "1",
        "data-tt-me-settings-route": "security",
        "data-tt-me-settings-ui-frozen": "1",
      }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={vm.t} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <MeSettingsSubpageHeader
          t={vm.t}
          titleId={vm.mainTitleId}
          eyebrowKey="me_settings_eyebrow"
          titleKey="me_security_page_title"
          subtitleKey="me_security_page_subtitle"
        />
        <button
          type="button"
          onClick={() => void vm.loadAll()}
          disabled={vm.loading}
          className={`${TT_ME_SECURITY_L5.btnSecondary} shrink-0 self-start`}
        >
          {vm.loading ? vm.t("me_security_page_refreshing") : vm.t("me_security_page_refresh")}
        </button>
      </div>

      {vm.error ? (
        <div className={TT_ME_SECURITY_L5.errorBanner} role="alert">
          {vm.error}
        </div>
      ) : null}

      <p className="text-meta text-slate-500/90">
        <Link
          href="/me/settings/notifications-prefs"
          className={`text-ref-sun/80 underline underline-offset-4 hover:text-[#fde9a8] ${authL5InlineLinkFocusClasses}`}
        >
          {vm.t("me_security_page_link_notification_prefs")}
        </Link>
      </p>

      <div className="flex flex-col gap-5">
        <MeSecurityWalletVerifySection />
        <MeSecuritySessionsSection
          t={vm.t}
          cellPh={vm.cellPh}
          formatTs={vm.formatTs}
          activeSessions={vm.activeSessions}
          exportSessionsDisabled={vm.exportSessionsDisabled}
          busySuffix={vm.busySuffix}
          revokeCurrent={vm.revokeCurrent}
          revokeBySuffix={vm.revokeBySuffix}
          exportSessionsJson={vm.exportSessionsJson}
        />
        <MeSecurityNotificationsSection
          t={vm.t}
          cellPh={vm.cellPh}
          formatTs={vm.formatTs}
          loading={vm.loading}
          loadAll={vm.loadAll}
          exportNotificationsDisabled={vm.exportNotificationsDisabled}
          notifStatus={vm.notifStatus}
          setNotifStatus={vm.setNotifStatus}
          notifEventType={vm.notifEventType}
          setNotifEventType={vm.setNotifEventType}
          notifLimit={vm.notifLimit}
          setNotifLimit={vm.setNotifLimit}
          riskOnlyFailed={vm.riskOnlyFailed}
          setRiskOnlyFailed={vm.setRiskOnlyFailed}
          riskOnlyPasswordRelated={vm.riskOnlyPasswordRelated}
          setRiskOnlyPasswordRelated={vm.setRiskOnlyPasswordRelated}
          exportNotificationsJson={vm.exportNotificationsJson}
          visibleNotifications={vm.visibleNotifications}
          expandedNotificationIds={vm.expandedNotificationIds}
          toggleNotificationExpand={vm.toggleNotificationExpand}
        />
      </div>

      <MeSettingsL5ConfirmDialog
        open={vm.confirm.open}
        busy={vm.confirm.busy}
        t={vm.t}
        titleKey={vm.confirm.pending?.titleKey ?? "me_security_page_revoke_current_title"}
        descKey={vm.confirm.pending?.descKey ?? "me_security_page_revoke_current_confirm"}
        descVars={vm.confirm.pending?.descVars}
        danger={vm.confirm.pending?.danger}
        confirmLabelKey={vm.confirm.pending?.confirmLabelKey}
        onCancel={vm.confirm.cancel}
        onConfirm={() => void vm.confirm.confirm()}
      />
    </MeSettingsL5FlowPage>
  );
}
