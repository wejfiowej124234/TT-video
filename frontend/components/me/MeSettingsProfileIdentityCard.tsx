"use client";

import Image from "next/image";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { UserShape } from "@/components/me/constants";
import { MeGuideRoleBadge } from "@/components/me/MeGuideRoleBadge";
import { communityRoleLabelI18nKey, meProtocolRoleForDisplay, userIsGuide } from "@/lib/meRoleDisplay";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import type { ProfileWalletDisplay } from "@/lib/me/meSettingsProfileDisplay";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import type { FormEvent, ChangeEvent, RefObject } from "react";
import { useEffect, useState } from "react";

type TFunc = (key: string) => string;

export function MeSettingsProfileIdentityCard({
  t,
  user,
  displayName,
  headerInitial,
  headerAvatarResolved,
  walletDisplay,
  bioCardText,
  bioFeatureOn,
  avatarFileRef,
  onAvatarPickClick,
  onAvatarFileChange,
  avatarUploadBusy,
  avatarLocalUploadEnabled,
  avatarUploadErr,
  editing,
  onEditProfile,
  onCancelEdit,
  onSyncWallet,
  syncingWallet,
  showWalletSync,
}: {
  t: TFunc;
  user: UserShape;
  displayName: string;
  headerInitial: string;
  headerAvatarResolved: string;
  walletDisplay: ProfileWalletDisplay;
  bioCardText: string;
  bioFeatureOn: boolean;
  avatarFileRef: RefObject<HTMLInputElement | null>;
  onAvatarPickClick: (e: FormEvent) => void;
  onAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  avatarUploadBusy: boolean;
  avatarLocalUploadEnabled: boolean;
  avatarUploadErr: string | null;
  editing: boolean;
  onEditProfile: () => void;
  onCancelEdit: () => void;
  onSyncWallet: () => void;
  syncingWallet: boolean;
  showWalletSync: boolean;
}) {
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const [avatarRetryKey, setAvatarRetryKey] = useState(0);
  const hasAvatarUrl = Boolean(headerAvatarResolved);
  const showAvatarImage = hasAvatarUrl && !avatarImgFailed;

  useEffect(() => {
    setAvatarImgFailed(false);
    setAvatarRetryKey(0);
  }, [headerAvatarResolved]);

  const retryAvatarLoad = () => {
    setAvatarImgFailed(false);
    setAvatarRetryKey((k) => k + 1);
  };

  return (
    <div data-tt-me-settings-profile-identity="1">
      <div className={TT_ME_SETTINGS_L5.profileIdentityRow}>
        <div className="relative shrink-0 text-center">
          <div className={TT_ME_SETTINGS_L5.profileIdentityAvatar}>
            {showAvatarImage ? (
              <Image
                key={avatarRetryKey}
                src={headerAvatarResolved}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={communityMediaNextImageUnoptimized(headerAvatarResolved)}
                onError={() => setAvatarImgFailed(true)}
              />
            ) : (
              <span className={TT_ME_SETTINGS_L5.profileIdentityAvatarInitial} aria-hidden>
                {headerInitial}
              </span>
            )}
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={onAvatarFileChange}
          />
          {avatarLocalUploadEnabled && !editing ? (
            <form className="absolute -bottom-0.5 -right-0.5" onSubmit={onAvatarPickClick}>
              <button
                type="submit"
                disabled={avatarUploadBusy}
                aria-busy={avatarUploadBusy ? true : undefined}
                className={TT_ME_SETTINGS_L5.profileIdentityAvatarBtn}
                aria-label={t("community_me_change_avatar")}
                title={t("community_me_upload_avatar")}
              >
                <span className="text-body font-bold leading-none">+</span>
              </button>
            </form>
          ) : null}
          {!editing ? (
            <p className={TT_ME_SETTINGS_L5.profileAvatarUploadHint}>
              {avatarLocalUploadEnabled
                ? t("community_me_upload_avatar")
                : t("me_settings_profile_avatar_upload_disabled")}
            </p>
          ) : null}
          {hasAvatarUrl && avatarImgFailed ? (
            <div
              className={`${TT_ME_SETTINGS_L5.profileAvatarLoadFailed} mt-2`}
              role="status"
              data-tt-me-settings-profile-avatar-load-failed="1"
            >
              <p>{t("me_settings_profile_avatar_load_failed")}</p>
              <button type="button" className={TT_ME_SETTINGS_L5.profileIdentityLink} onClick={retryAvatarLoad}>
                {t("common_retry")}
              </button>
            </div>
          ) : null}
        </div>

        <div className={TT_ME_SETTINGS_L5.profileIdentityBody}>
          <p className={TT_ME_SETTINGS_L5.profileIdentityName}>{displayName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <MeGuideRoleBadge user={user} />
            {!userIsGuide(user) ? (
              <span className={TT_ME_SETTINGS_L5.profileRole}>
                {t(communityRoleLabelI18nKey(meProtocolRoleForDisplay(user)))}
              </span>
            ) : null}
          </div>
          <p className={`${TT_ME_SETTINGS_L5.profileMeta} mt-2 break-all`}>
            {t("community_did_wallet_label")}
            {t("community_did_colon")}
            <span
              className={`font-mono ${walletDisplay.kind === "connected_unsaved" ? "text-ref-sun/85" : "text-slate-300"}`}
            >
              {walletDisplay.displayText}
            </span>
          </p>
          {bioFeatureOn ? (
            bioCardText ? (
              <p className={TT_ME_SETTINGS_L5.profileIdentityBio}>{bioCardText}</p>
            ) : (
              <>
                <p className={TT_ME_SETTINGS_L5.profileIdentityBioEmpty}>{t("community_me_bio_empty")}</p>
                {!editing ? (
                  <button type="button" className={TT_ME_SETTINGS_L5.profileIdentityLink} onClick={onEditProfile}>
                    {t("community_me_add_bio")}
                  </button>
                ) : null}
              </>
            )
          ) : (
            <p className={TT_ME_SETTINGS_L5.profileIdentityBioEmpty}>{t("me_settings_profile_bio_unavailable")}</p>
          )}
        </div>
      </div>

      {!editing ? (
        <div className={TT_ME_SETTINGS_L5.profileIdentityActions}>
          <button type="button" className={TT_ME_SETTINGS_L5.profileIdentityEditBtn} onClick={onEditProfile}>
            {t("community_me_edit_profile")}
          </button>
          {showWalletSync ? (
            <button
              type="button"
              disabled={syncingWallet}
              aria-busy={syncingWallet ? true : undefined}
              className={TT_ME_SETTINGS_L5.profileIdentityEditBtn}
              onClick={() => onSyncWallet()}
            >
              {syncingWallet ? t("me_syncing") : t("me_settings_profile_wallet_sync_action")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className={TT_ME_SETTINGS_L5.profileIdentityActions}>
          <button type="button" className={TT_ME_SETTINGS_L5.profileIdentityEditBtn} onClick={onCancelEdit}>
            {t("me_cancel")}
          </button>
        </div>
      )}

      {avatarUploadErr ? (
        <div className="mt-4 px-4 sm:px-5" role="alert">
          <ApiErrorAlert message={avatarUploadErr} tone="dark" />
        </div>
      ) : null}
    </div>
  );
}
