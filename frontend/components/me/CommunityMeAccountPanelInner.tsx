"use client";

import { useEffect } from "react";
import CommunityMeQuickLinksDrawer from "@/components/community/CommunityMeQuickLinksDrawer";
import { useMePage } from "@/components/me/useMePage";
import type { UserShape } from "@/components/me/constants";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import { isCommunityMeBioEnabled, isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";
import CommunityMeAccountPanelLoading from "@/components/me/communityMePage/CommunityMeAccountPanelLoading";
import CommunityMeAccountPanelError from "@/components/me/communityMePage/CommunityMeAccountPanelError";
import CommunityMeAccountPanelProfileCard from "@/components/me/communityMePage/CommunityMeAccountPanelProfileCard";
import { useCommunityMeAccountPanelAvatar } from "@/components/me/communityMePage/useCommunityMeAccountPanelAvatar";
import type { CommunityMeAccountPanelProps } from "@/components/me/communityMePage/communityMeAccountPanelTypes";
import {
  meSettingsShowAcquisitionHub,
  meSettingsShowGuideHub,
  meSettingsShowMerchantHub,
  meSettingsShowStewardHub,
} from "@/lib/me/meIdentitySlotVisibility";
import { useMeIdentitySlots } from "@/lib/me/useMeIdentitySlots";
import type { MeProfileSectionProps } from "@/components/me/meProfileSectionTypes";

type InnerProps = Omit<CommunityMeAccountPanelProps, "enabled">;

export function CommunityMeAccountPanelInner({
  t,
  socialStatsState,
  onSocialStatsRetry,
  compactVertical = false,
  showLikesReceivedMetric = true,
  hideLikesReceivedMetric = false,
  hideQuickLinks = false,
}: InnerProps) {
  const hook = useMePage(t, { skipAvatarUrlOnProfileSave: true });
  const { ready: slotsReady, slotById } = useMeIdentitySlots();
  const likesListEnabled = isCommunityMeLikesListEnabled();
  const bioFeatureOn = isCommunityMeBioEnabled();

  const profileReady =
    !hook.loading && !hook.error && Boolean((hook.data as { user?: UserShape })?.user);

  const avatar = useCommunityMeAccountPanelAvatar({
    t,
    compactVertical,
    profileReady,
    loadMe: hook.loadMe,
  });

  useEffect(() => {
    if (!compactVertical || !profileReady) return;
    const openIfHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#me-platform-profile" && avatar.profileDetailsRef.current) {
        avatar.profileDetailsRef.current.open = true;
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, [compactVertical, profileReady, avatar.profileDetailsRef]);

  if (hook.loading) {
    return <CommunityMeAccountPanelLoading />;
  }

  if (hook.error) {
    return <CommunityMeAccountPanelError message={hook.error} onRetry={() => hook.loadMe()} t={t} />;
  }

  const user = (hook.data as { user?: UserShape })?.user;
  if (!user) return null;

  const displayName =
    (user.nickname?.trim() && user.nickname.trim()) || user.id?.slice(0, 8) || t("me_defaultDisplayName");
  const headerInitial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const headerAvatarResolved = user.avatar_url?.trim()
    ? communityMediaAbsoluteUrlForRender(user.avatar_url.trim())
    : "";
  const rawWallet = user.default_wallet_address?.trim();
  const walletPreview =
    rawWallet && rawWallet.length > 0
      ? (formatWalletOrDidShort(rawWallet) ?? rawWallet)
      : t("community_did_placeholder");
  const bioCardText =
    bioFeatureOn && typeof user.bio === "string" && user.bio.trim() ? user.bio.trim() : "";

  const showLikesMetric = showLikesReceivedMetric && likesListEnabled && !hideLikesReceivedMetric;

  const meProfileBase: MeProfileSectionProps = {
    t,
    user,
    editing: hook.editing,
    setEditing: hook.setEditing,
    editForm: hook.editForm,
    setEditForm: hook.setEditForm,
    submitError: hook.submitError,
    submitting: hook.submitting,
    avatarError: hook.avatarError,
    setAvatarError: hook.setAvatarError,
    copiedField: hook.copiedField,
    copyClipboardBusy: hook.copyClipboardBusy,
    copyToClipboard: hook.copyToClipboard,
    connectedAddress: hook.connectedAddress,
    syncingWallet: hook.syncingWallet,
    editButtonRef: hook.editButtonRef,
    handleSubmit: hook.handleSubmit,
    handleSyncWallet: hook.handleSyncWallet,
    compactCommunityLayout: true,
    unifiedInCommunityCard: true,
  };

  const meProfileCompact = { ...meProfileBase, omitAnchorId: true as const, insetInCollapsible: true as const };
  const meProfileFull = { ...meProfileBase, omitAnchorId: false as const, insetInCollapsible: false as const };

  return (
    <div className={compactVertical ? "space-y-3" : "space-y-4 sm:space-y-5"}>
      <CommunityMeAccountPanelProfileCard
        t={t}
        compactVertical={compactVertical}
        user={user}
        displayName={displayName}
        headerInitial={headerInitial}
        headerAvatarResolved={headerAvatarResolved}
        walletPreview={walletPreview}
        bioCardText={bioCardText}
        bioFeatureOn={bioFeatureOn}
        avatarFileRef={avatar.avatarFileRef}
        profileDetailsRef={avatar.profileDetailsRef}
        onAvatarPickClick={avatar.onAvatarPickClick}
        onAvatarFileChange={avatar.onAvatarFileChange}
        avatarUploadBusy={avatar.avatarUploadBusy}
        avatarLocalUploadEnabled={avatar.avatarLocalUploadEnabled}
        avatarUploadErr={avatar.avatarUploadErr}
        socialStatsState={socialStatsState}
        onSocialStatsRetry={onSocialStatsRetry}
        showLikesReceivedMetric={showLikesMetric}
        meProfileCompact={meProfileCompact}
        meProfileFull={meProfileFull}
      />

      {hideQuickLinks ? null : (
        <CommunityMeQuickLinksDrawer
          t={t}
          showGuideHub={meSettingsShowGuideHub({
            userRole: user.role,
            guideSlotState: slotsReady ? slotById("guide")?.state ?? null : null,
          })}
          showMerchantHub={meSettingsShowMerchantHub({
            userRole: user.role,
            merchantSlotState: slotsReady ? slotById("merchant")?.state ?? null : null,
          })}
          showStewardHub={meSettingsShowStewardHub({
            userRole: user.role,
            stewardSlotState: slotsReady ? slotById("region_steward")?.state ?? null : null,
          })}
          showAcquisitionHub={meSettingsShowAcquisitionHub({
            acquisitionSlotState: slotsReady ? slotById("acquisition")?.state ?? null : null,
          })}
          likesListEnabled={likesListEnabled}
        />
      )}
    </div>
  );
}
