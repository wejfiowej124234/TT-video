"use client";

import { useRef } from "react";
import { MeSettingsProfileIdentityCard } from "@/components/me/MeSettingsProfileIdentityCard";
import { MeSettingsProfileSocialStats } from "@/components/me/MeSettingsProfileSocialStats";
import { MeSettingsProfilePanelLoading } from "@/components/me/MeSettingsProfilePanelLoading";
import { MeSettingsProfilePanelError } from "@/components/me/MeSettingsProfilePanelError";
import { MeSettingsProfileCompleteness } from "@/components/me/MeSettingsProfileCompleteness";
import {
  MeSettingsProfileAccountDetails,
  MeSettingsProfileEditForm,
  MeSettingsProfilePrivacyLink,
} from "@/components/me/MeSettingsProfileDetails";
import { useCommunityMeAccountPanelAvatar } from "@/components/me/communityMePage/useCommunityMeAccountPanelAvatar";
import type { CommunityMeAccountPanelTFunc } from "@/components/me/communityMePage/communityMeAccountPanelUtils";
import type { CommunitySocialStatsPayload, DataState } from "@/lib/dataState";
import { useMePage } from "@/components/me/useMePage";
import type { UserShape } from "@/components/me/constants";
import { isCommunityMeBioEnabled, isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import { resolveProfileWalletDisplay } from "@/lib/me/meSettingsProfileDisplay";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

export type MeSettingsProfilePanelProps = {
  t: CommunityMeAccountPanelTFunc;
  socialStatsState: DataState<CommunitySocialStatsPayload>;
  onSocialStatsRetry?: () => void;
  showLikesReceivedMetric?: boolean;
  hideLikesReceivedMetric?: boolean;
};

/** 设置 L5 · 个人资料编辑（暖金壳 · 非社区 cyan 资料卡） */
export function MeSettingsProfilePanel(props: MeSettingsProfilePanelProps) {
  const {
    t,
    socialStatsState,
    onSocialStatsRetry,
    showLikesReceivedMetric = true,
    hideLikesReceivedMetric = false,
  } = props;

  const hook = useMePage(t, { skipAvatarUrlOnProfileSave: true });
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const bioFeatureOn = isCommunityMeBioEnabled();
  const showLikesMetric = showLikesReceivedMetric && isCommunityMeLikesListEnabled() && !hideLikesReceivedMetric;

  const profileReady = !hook.loading && !hook.error && Boolean((hook.data as { user?: UserShape })?.user);

  const avatar = useCommunityMeAccountPanelAvatar({
    t,
    compactVertical: false,
    profileReady,
    loadMe: hook.loadMe,
  });

  if (hook.loading) {
    return <MeSettingsProfilePanelLoading />;
  }

  if (hook.error) {
    return <MeSettingsProfilePanelError message={hook.error} onRetry={() => hook.loadMe()} t={t} />;
  }

  const user = (hook.data as { user?: UserShape })?.user;
  if (!user) return null;

  const displayName =
    (user.nickname?.trim() && user.nickname.trim()) || user.id?.slice(0, 8) || t("me_defaultDisplayName");
  const headerInitial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const headerAvatarResolved = user.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(user.avatar_url.trim())
    : "";
  const bioCardText =
    bioFeatureOn && typeof user.bio === "string" && user.bio.trim() ? user.bio.trim() : "";
  const walletDisplay = resolveProfileWalletDisplay(t, user.default_wallet_address, hook.connectedAddress);

  const openEdit = () => {
    hook.setEditing(true);
    queueMicrotask(() => editButtonRef.current?.focus({ preventScroll: true }));
  };

  const cancelEdit = () => {
    hook.setEditing(false);
    hook.setEditForm({
      nickname: user.nickname ?? "",
      avatar_url: user.avatar_url ?? "",
      default_wallet_address: user.default_wallet_address ?? "",
      bio: typeof user.bio === "string" ? user.bio : "",
    });
  };

  return (
    <div className={TT_ME_SETTINGS_L5.profilePageStack} data-tt-me-settings-profile-panel="1">
      <div className={TT_ME_SETTINGS_L5.profileIdentityCard} data-tt-me-settings-profile-identity-wrap="1">
        <MeSettingsProfileIdentityCard
          t={t}
          user={user}
          displayName={displayName}
          headerInitial={headerInitial}
          headerAvatarResolved={headerAvatarResolved}
          walletDisplay={walletDisplay}
          bioCardText={bioCardText}
          bioFeatureOn={bioFeatureOn}
          avatarFileRef={avatar.avatarFileRef}
          onAvatarPickClick={avatar.onAvatarPickClick}
          onAvatarFileChange={avatar.onAvatarFileChange}
          avatarUploadBusy={avatar.avatarUploadBusy}
          avatarLocalUploadEnabled={avatar.avatarLocalUploadEnabled}
          avatarUploadErr={avatar.avatarUploadErr}
          editing={hook.editing}
          onEditProfile={openEdit}
          onCancelEdit={cancelEdit}
          onSyncWallet={hook.handleSyncWallet}
          syncingWallet={hook.syncingWallet}
          showWalletSync={
            Boolean(hook.connectedAddress) && !user.default_wallet_address?.trim() && !hook.editing
          }
        />
        {hook.editing ? (
          <MeSettingsProfileEditForm
            t={t}
            editForm={hook.editForm}
            setEditForm={hook.setEditForm}
            submitError={hook.submitError}
            submitting={hook.submitting}
            connectedAddress={hook.connectedAddress}
            handleSubmit={hook.handleSubmit}
            editButtonRef={editButtonRef}
            avatarLocalUploadEnabled={avatar.avatarLocalUploadEnabled}
          />
        ) : null}
      </div>

      {!hook.editing ? <MeSettingsProfileCompleteness user={user} t={t} /> : null}

      <section aria-labelledby="me-settings-profile-social-heading">
        <h2 id="me-settings-profile-social-heading" className={TT_ME_SETTINGS_L5.sectionTitle}>
          {t("me_settings_profile_social_section")}
        </h2>
        <p className={TT_ME_SETTINGS_L5.profileSectionHint}>{t("me_settings_profile_social_hint")}</p>
        <div className={`${TT_ME_SETTINGS_L5.sectionCard} px-3 py-3 sm:px-4 sm:py-4`}>
          <MeSettingsProfileSocialStats
            state={socialStatsState}
            t={t}
            onRetry={onSocialStatsRetry}
            showLikesReceivedMetric={showLikesMetric}
          />
        </div>
      </section>

      {!hook.editing ? (
        <section aria-labelledby="me-settings-profile-details-heading">
          <h2 id="me-settings-profile-details-heading" className={TT_ME_SETTINGS_L5.sectionTitle}>
            {t("me_settings_profile_details_section")}
          </h2>
          <p className={TT_ME_SETTINGS_L5.profileSectionHint}>{t("me_settings_profile_details_hint")}</p>
          <div id="me-platform-profile" className={TT_ME_SETTINGS_L5.profileDetailsCard}>
            <MeSettingsProfileAccountDetails
              t={t}
              user={user}
              connectedAddress={hook.connectedAddress}
              copiedField={hook.copiedField}
              copyClipboardBusy={hook.copyClipboardBusy}
              copyToClipboard={hook.copyToClipboard}
              syncingWallet={hook.syncingWallet}
              onSyncWallet={hook.handleSyncWallet}
            />
          </div>
        </section>
      ) : null}

      {!hook.editing ? <MeSettingsProfilePrivacyLink t={t} /> : null}
    </div>
  );
}
