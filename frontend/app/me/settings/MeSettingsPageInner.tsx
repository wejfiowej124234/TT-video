"use client";

import { MeSettingsL5BackLink } from "@/components/me/MeSettingsL5BackLink";
import { MeSettingsHubFlashBanner } from "@/components/me/MeSettingsHubFlashBanner";
import { MeSettingsHubSection } from "@/components/me/MeSettingsHubSection";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import { MeSettingsLogoutButton } from "@/components/me/MeSettingsLogoutButton";
import { MeSettingsProfileCard, MeSettingsProfileCardSkeleton } from "@/components/me/MeSettingsProfileCard";
import { useTranslation } from "@/components/LocaleProvider";
import { useMeSettingsHubFlash } from "@/lib/me/useMeSettingsHubFlash";
import { useMeSettingsHubStatus } from "@/lib/me/useMeSettingsHubStatus";
import { useMeSettingsSummary } from "@/lib/me/useMeSettingsSummary";
import { meSettingsL5MainDataAttrs, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { meSettingsNavSections } from "@/lib/me/meSettingsNavModel";
import {
  meSettingsShowAcquisitionHub,
  meSettingsShowGuideHub,
  meSettingsShowMerchantHub,
  meSettingsShowStewardHub,
} from "@/lib/me/meIdentitySlotVisibility";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import { useActiveWorkspaceContext } from "@/lib/header/useActiveWorkspaceContext";
import { useMeSettingsHubPathnameReload } from "@/lib/me/useMeSettingsHubPathnameReload";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function MeSettingsPageInner() {
  const { t } = useTranslation();
  const flash = useMeSettingsHubFlash(t);
  const { user, loading, error, reload } = useMeSettingsSummary(t);
  const hubReady = !loading && !!user && !error;
  const hubStatus = useMeSettingsHubStatus(hubReady);
  useMeSettingsHubPathnameReload(() => {
    void hubStatus.reload();
    reload();
  }, hubReady);
  const { ready: slotsReady, slotById, slots } = useMeIdentitySlots();
  const { context: workspaceContext } = useActiveWorkspaceContext(slotsReady ? slots : null);
  const sections = meSettingsNavSections({
    showGuideHub: meSettingsShowGuideHub({
      userRole: user?.role ?? null,
      guideSlotState: slotsReady ? slotById("guide")?.state ?? null : null,
    }),
    showMerchantHub: meSettingsShowMerchantHub({
      userRole: user?.role ?? null,
      merchantSlotState: slotsReady ? slotById("merchant")?.state ?? null : null,
    }),
    showStewardHub: meSettingsShowStewardHub({
      userRole: user?.role ?? null,
      stewardSlotState: slotsReady ? slotById("region_steward")?.state ?? null : null,
    }),
    showAcquisitionHub: meSettingsShowAcquisitionHub({
      acquisitionSlotState: slotsReady ? slotById("acquisition")?.state ?? null : null,
    }),
    workspaceContext,
  });
  const soonLabel = t("me_settings_badge_soon");

  return (
    <MeSettingsL5FlowPage ariaLabel={t("me_settings_pageTitle")} route="settings" dataAttrs={meSettingsL5MainDataAttrs()}>
      <MeSettingsL5BackLink t={t} />

      <header className={TT_ME_SETTINGS_L5.headerBlock}>
        <p className={TT_ME_SETTINGS_L5.eyebrow}>{t("me_settings_eyebrow")}</p>
        <h1 className={TT_ME_SETTINGS_L5.title}>{t("me_settings_pageTitle")}</h1>
        <p className={TT_ME_SETTINGS_L5.subtitle}>{t("me_settings_subtitle")}</p>
      </header>

      {flash ? (
        <MeSettingsHubFlashBanner
          message={flash.message}
          onDismiss={flash.dismiss}
          dismissLabel={t("me_settings_flash_dismiss")}
        />
      ) : null}

      {loading && !user ? <MeSettingsProfileCardSkeleton /> : null}
      {user ? <MeSettingsProfileCard user={user} t={t} /> : null}
      {!loading && error ? (
        <p className={TT_ME_SETTINGS_L5.subtitle} role="alert">
          {error}{" "}
          <button
            type="button"
            onClick={() => reload()}
            className={`${touchTargetLink44Classes} inline text-ref-sun underline ${authL5InlineLinkFocusClasses}`}
          >
            {t("common_retry")}
          </button>
        </p>
      ) : null}

      <div className={TT_ME_SETTINGS_L5.sectionsStack}>
        {sections.map((section) => (
          <MeSettingsHubSection
            key={section.id}
            section={section}
            t={t}
            hubStatus={hubStatus}
            user={user ?? null}
            soonLabel={soonLabel}
          />
        ))}
      </div>

      <div className={TT_ME_SETTINGS_L5.logoutSection}>
        <MeSettingsLogoutButton />
      </div>
    </MeSettingsL5FlowPage>
  );
}
