"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useId } from "react";
import CopyButton from "@/components/me/CopyButton";
import type { MeProfileEditForm, UserShape } from "@/components/me/constants";
import { formatJoinedAt } from "@/components/me/constants";
import { TT_AUTH_L5_FORM, authL5FieldClass } from "@/lib/auth/authL5Form";
import { isCommunityMeBioEnabled } from "@/lib/communityMeFeatureFlags";
import { isMeEmailVerified } from "@/lib/me/meSettingsUser";
import { resolveProfileWalletDisplay } from "@/lib/me/meSettingsProfileDisplay";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { ME_SETTINGS_PRIVACY_PATH } from "@/lib/me/meSettingsL5";

export function MeSettingsProfileEditForm({
  t,
  editForm,
  setEditForm,
  submitError,
  submitting,
  connectedAddress,
  handleSubmit,
  editButtonRef,
  avatarLocalUploadEnabled,
}: {
  t: (key: string) => string;
  editForm: MeProfileEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<MeProfileEditForm>>;
  submitError: string | null;
  submitting: boolean;
  connectedAddress: string | undefined;
  handleSubmit: (e: FormEvent) => void;
  editButtonRef: React.RefObject<HTMLButtonElement | null>;
  avatarLocalUploadEnabled: boolean;
}) {
  const bioOn = isCommunityMeBioEnabled();
  const profileEditFormId = useId();
  const editNicknameInputId = useId();
  const editBioInputId = useId();
  const editWalletInputId = useId();
  const editErrorId = useId();

  return (
    <div className={TT_ME_SETTINGS_L5.profileEditFormWrap} data-tt-me-settings-profile-edit-form="1">
      <p className={TT_ME_SETTINGS_L5.profileFieldGroupTitle}>{t("me_settings_profile_group_public")}</p>
      <form id={profileEditFormId} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={TT_ME_SETTINGS_L5.profileFieldLabel} htmlFor={editNicknameInputId}>
            {t("me_nickname")}
          </label>
          <input
            id={editNicknameInputId}
            type="text"
            autoComplete="nickname"
            value={editForm.nickname}
            onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
            className={authL5FieldClass(false)}
            placeholder={t("me_notSet")}
            aria-describedby={submitError ? editErrorId : undefined}
          />
        </div>
        {bioOn ? (
          <div>
            <label className={TT_ME_SETTINGS_L5.profileFieldLabel} htmlFor={editBioInputId}>
              {t("me_bio")}
            </label>
            <textarea
              id={editBioInputId}
              rows={3}
              maxLength={2048}
              value={editForm.bio}
              onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
              className={`${authL5FieldClass(false)} min-h-[88px] resize-y`}
              placeholder={t("community_me_bio_empty")}
              aria-describedby={submitError ? editErrorId : undefined}
            />
            <p className={TT_ME_SETTINGS_L5.profileFieldHint}>{t("me_settings_profile_bio_hint")}</p>
          </div>
        ) : null}
        <p className={TT_ME_SETTINGS_L5.profileFieldHint} role="note">
          {avatarLocalUploadEnabled
            ? t("community_me_avatar_upload_hint")
            : t("me_settings_profile_avatar_upload_disabled")}
        </p>
        <div>
          <label className={TT_ME_SETTINGS_L5.profileFieldLabel} htmlFor={editWalletInputId}>
            {t("me_wallet")}
          </label>
          <div className="flex gap-2">
            <input
              id={editWalletInputId}
              type="text"
              autoComplete="off"
              value={editForm.default_wallet_address}
              onChange={(e) => setEditForm((f) => ({ ...f, default_wallet_address: e.target.value }))}
              className={`${authL5FieldClass(false)} flex-1 font-mono`}
              placeholder={t("auth_register_placeholder_wallet")}
            />
            {connectedAddress ? (
              <button
                type="button"
                className={`${TT_AUTH_L5_FORM.secondaryButton} shrink-0 min-h-[44px] px-3`}
                onClick={() => setEditForm((f) => ({ ...f, default_wallet_address: connectedAddress }))}
              >
                {t("me_useConnectedWallet")}
              </button>
            ) : null}
          </div>
        </div>
        {submitError ? (
          <p id={editErrorId} className="text-small text-warning" role="alert">
            {submitError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            ref={editButtonRef}
            type="submit"
            disabled={submitting}
            aria-busy={submitting ? true : undefined}
            className={`${TT_AUTH_L5_FORM.primaryCta} w-auto px-5 py-2.5 min-h-[44px] text-meta`}
          >
            {submitting ? t("me_syncing") : t("me_save")}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MeSettingsProfileAccountDetails({
  t,
  user,
  connectedAddress,
  copiedField,
  copyClipboardBusy,
  copyToClipboard,
  syncingWallet,
  onSyncWallet,
}: {
  t: (key: string) => string;
  user: UserShape;
  connectedAddress: string | undefined;
  copiedField: "id" | "wallet" | null;
  copyClipboardBusy: "id" | "wallet" | null;
  copyToClipboard: (text: string, field: "id" | "wallet") => void;
  syncingWallet: boolean;
  onSyncWallet: () => void;
}) {
  const verified = isMeEmailVerified(user);
  const wallet = resolveProfileWalletDisplay(t, user.default_wallet_address, connectedAddress);

  return (
    <div className="p-4 sm:p-5 space-y-4" data-tt-me-settings-profile-account-details="1">
      <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
        <div className="sm:col-span-2">
          <p className={TT_ME_SETTINGS_L5.profileFieldLabel}>{t("me_email")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={TT_ME_SETTINGS_L5.profileFieldValue}>{user.email ?? t("ui_em_dash")}</span>
            {verified ? (
              <span className={TT_ME_SETTINGS_L5.profileBadgeOk}>{t("me_settings_hub_status_email_verified")}</span>
            ) : (
              <Link href="/auth/verify-email?from=settings" className={TT_ME_SETTINGS_L5.profileBadgeWarn}>
                {t("me_settings_profile_email_unverified")}
              </Link>
            )}
          </div>
        </div>
        <div>
          <p className={TT_ME_SETTINGS_L5.profileFieldLabel}>{t("me_joinedAt")}</p>
          <p className={`${TT_ME_SETTINGS_L5.profileFieldValue} mt-1`}>
            {formatJoinedAt(user.created_at, t("ui_em_dash"))}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className={TT_ME_SETTINGS_L5.profileFieldLabel}>{t("me_id")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <p className={`${TT_ME_SETTINGS_L5.profileFieldValueMono} break-all min-w-0`}>{user.id}</p>
            {user.id ? (
              <CopyButton
                text={user.id}
                field="id"
                copiedField={copiedField}
                copyClipboardBusy={copyClipboardBusy}
                onCopy={copyToClipboard}
                t={t}
              />
            ) : null}
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className={TT_ME_SETTINGS_L5.profileFieldLabel}>{t("me_wallet")}</p>
          <div className="mt-1 space-y-2">
            <p className={`${TT_ME_SETTINGS_L5.profileFieldValueMono} break-all`}>{wallet.displayText}</p>
            {wallet.kind === "saved" && wallet.savedAddress ? (
              <CopyButton
                text={wallet.savedAddress}
                field="wallet"
                copiedField={copiedField}
                copyClipboardBusy={copyClipboardBusy}
                onCopy={copyToClipboard}
                t={t}
              />
            ) : null}
            {wallet.kind === "connected_unsaved" && connectedAddress ? (
              <div className={TT_ME_SETTINGS_L5.sectionCallout}>
                <p>{t("me_settings_profile_wallet_sync_hint")}</p>
                <button
                  type="button"
                  disabled={syncingWallet}
                  aria-busy={syncingWallet ? true : undefined}
                  className={`${TT_AUTH_L5_FORM.secondaryButton} mt-3 w-auto px-5 py-2.5 min-h-[44px] text-meta`}
                  onClick={() => onSyncWallet()}
                >
                  {syncingWallet ? t("me_syncing") : t("me_settings_profile_wallet_sync_action")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copiedField ? t("me_copiedAnnounce") : ""}
      </p>
    </div>
  );
}

export function MeSettingsProfilePrivacyLink({ t }: { t: (key: string) => string }) {
  return (
    <section aria-labelledby="me-settings-profile-privacy-heading" data-tt-me-settings-profile-privacy-link="1">
      <h2 id="me-settings-profile-privacy-heading" className={TT_ME_SETTINGS_L5.sectionTitle}>
        {t("me_settings_profile_privacy_section")}
      </h2>
      <p className={TT_ME_SETTINGS_L5.profileSectionHint}>{t("me_settings_profile_privacy_hint")}</p>
      <div className={TT_ME_SETTINGS_L5.sectionCard}>
        <Link href={ME_SETTINGS_PRIVACY_PATH} className={`${TT_ME_SETTINGS_L5.row} border-b-0`}>
          <span className={TT_ME_SETTINGS_L5.rowIcon} aria-hidden>
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l7 4v6c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V7l7-4z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className={TT_ME_SETTINGS_L5.rowBody}>
            <span className={TT_ME_SETTINGS_L5.rowLabel}>{t("me_settings_item_community_visibility")}</span>
            <span className={TT_ME_SETTINGS_L5.rowDesc}>{t("me_settings_profile_privacy_row_desc")}</span>
          </span>
          <svg className={TT_ME_SETTINGS_L5.rowChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
