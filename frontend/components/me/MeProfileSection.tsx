"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useId } from "react";
import CopyButton from "./CopyButton";
import { FOCUS_RING } from "./constants";
import type { UserShape } from "./constants";
import { formatJoinedAt } from "./constants";
import { meProtocolRoleForDisplay, meRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { TT_AUTH_L5_FORM, authL5FieldClass } from "@/lib/auth/authL5Form";
import { communityPublishFabFocus } from "@/lib/communityA11yFocus";
import type { MeProfileSectionProps } from "./meProfileSectionTypes";

export type { MeProfileSectionProps };

export default function MeProfileSection({
  t,
  user,
  editing,
  setEditing,
  editForm,
  setEditForm,
  submitError,
  submitting,
  avatarError,
  setAvatarError,
  copiedField,
  copyClipboardBusy,
  copyToClipboard,
  connectedAddress,
  syncingWallet,
  editButtonRef,
  handleSubmit,
  handleSyncWallet,
  compactCommunityLayout = false,
  unifiedInCommunityCard = false,
  omitAnchorId = false,
  insetInCollapsible = false,
  settingsL5Layout = false,
}: MeProfileSectionProps) {
  const titleId = useId();
  const editNicknameInputId = useId();
  const editAvatarInputId = useId();
  const editWalletInputId = useId();
  const profileEditFormId = useId();
  const editErrorId = useId();
  const showAvatar = user?.avatar_url?.trim() && !avatarError;
  const initial = (user?.nickname?.trim() && user.nickname.charAt(0)) || "?";
  const roleLabel = t(meRoleLabelI18nKey(meProtocolRoleForDisplay(user)));
  const editFieldInputClass = settingsL5Layout
    ? authL5FieldClass(false)
    : compactCommunityLayout
      ? `${TT_COMMUNITY_DRAWER_L5.publishInput} py-2`
      : "w-full rounded-[var(--radius-md)] border border-slate-600 bg-slate-800/80 px-3 py-2 text-small text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
  const editWalletInputClass = settingsL5Layout
    ? `${authL5FieldClass(false)} flex-1 font-mono`
    : compactCommunityLayout
      ? `${TT_COMMUNITY_DRAWER_L5.publishInput} flex-1 py-2 font-mono`
      : "flex-1 rounded-[var(--radius-md)] border border-slate-600 bg-slate-800/80 px-3 py-2 text-small font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";
  const editSaveBtnClass = settingsL5Layout
    ? `${TT_AUTH_L5_FORM.primaryCta} w-auto px-5 py-2.5 min-h-[44px] text-meta`
    : compactCommunityLayout
      ? `${TT_COMMUNITY_DRAWER_L5.sendBtn} px-4 py-2.5 min-h-[44px] text-meta ${communityPublishFabFocus}`
      : `inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub disabled:opacity-50 ${FOCUS_RING}`;
  const editCancelBtnClass = settingsL5Layout
    ? `${TT_AUTH_L5_FORM.secondaryButton} min-h-[44px]`
    : compactCommunityLayout
      ? `${TT_COMMUNITY_DRAWER_L5.publishGhostBtn} px-4 min-h-[44px] ${communityPublishFabFocus}`
      : `inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/60 px-4 py-2.5 min-h-[44px] text-meta text-slate-300 hover:bg-slate-700/60 motion-sub ${FOCUS_RING}`;
  const editWalletSyncBtnClass = settingsL5Layout
    ? `${TT_AUTH_L5_FORM.secondaryButton} shrink-0 min-h-[44px] px-3`
    : compactCommunityLayout
      ? `${TT_COMMUNITY_DRAWER_L5.publishGhostBtn} shrink-0 px-3 min-h-[44px] ${communityPublishFabFocus}`
      : `inline-flex shrink-0 min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-fuchsia-400/50 bg-fuchsia-500/20 px-3 py-2 text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub ${FOCUS_RING}`;
  const editProfileBtnClass = settingsL5Layout
    ? `${TT_AUTH_L5_FORM.primaryCta} w-auto px-5 py-2.5 min-h-[44px] text-meta`
    : `text-meta font-medium text-cyan-300 hover:text-cyan-100 underline underline-offset-2 min-h-[44px] inline-flex items-center motion-sub ${FOCUS_RING}`;
  const kycRaw =
    typeof user?.kyc_status === "string" && user.kyc_status.trim() !== ""
      ? user.kyc_status.trim()
      : "none";

  const RootTag = unifiedInCommunityCard || settingsL5Layout ? "div" : "section";
  const rootClass = settingsL5Layout
    ? "p-4 sm:p-5"
    : unifiedInCommunityCard
      ? insetInCollapsible
        ? "scroll-mt-24 pt-2"
        : "scroll-mt-24 border-t border-slate-600/45 pt-5 mt-5"
      : "scroll-mt-24 rounded-[var(--radius-md)] border border-fuchsia-500/30 bg-slate-900/70 backdrop-blur-md overflow-hidden mb-4 sm:mb-6 shadow-scifi-fuchsia-panel-md motion-sub hover:border-fuchsia-500/50 ring-1 ring-white/5";
  const showFuchsiaHeader = !unifiedInCommunityCard && !settingsL5Layout;
  const bodyClass =
    unifiedInCommunityCard && insetInCollapsible
      ? "space-y-2.5 sm:space-y-3"
      : unifiedInCommunityCard
        ? "space-y-4 sm:space-y-5"
        : "p-4 sm:p-6";

  return (
    <RootTag
      id={omitAnchorId ? undefined : "me-platform-profile"}
      className={rootClass}
      aria-labelledby={showFuchsiaHeader ? titleId : undefined}
      aria-label={unifiedInCommunityCard ? t("me_profile_platform_title") : undefined}
    >
      {showFuchsiaHeader ? (
        <div className="border-b border-fuchsia-500/20 bg-slate-800/60 px-4 py-3 sm:px-6 sm:py-3">
          <h2 id={titleId} className="text-body font-semibold text-fuchsia-200">
            {compactCommunityLayout ? t("me_profile_platform_title") : t("me_profile")}
          </h2>
        </div>
      ) : null}
      <div className={bodyClass}>
        {!editing ? (
          <>
            {compactCommunityLayout ? (
              <>
                {!unifiedInCommunityCard ? (
                  <p className="text-meta text-slate-300/95 mb-4 leading-relaxed">{t("me_profile_platform_caption")}</p>
                ) : null}
                <div className={unifiedInCommunityCard ? "grid grid-cols-1 gap-y-1.5 sm:grid-cols-2 sm:gap-x-4" : "space-y-1.5"}>
                  <p className="text-small text-slate-200 sm:col-span-2">
                    <span className="text-slate-300">{t("me_email")}</span>
                    {t("community_did_colon")}
                    {user.email ?? t("ui_em_dash")}
                  </p>
                  <p className="text-meta text-slate-300">
                    {t("me_joinedAt")}: {formatJoinedAt(user.created_at, t("ui_em_dash"))}
                  </p>
                  {unifiedInCommunityCard ? null : (
                    <p className="text-meta text-slate-300 sm:col-span-2">
                      {t("me_kycStatus")}{" "}
                      <span className="text-slate-100 font-mono" translate="no">
                        {kycRaw}
                      </span>
                    </p>
                  )}
                  {!unifiedInCommunityCard ? <p className="text-meta text-slate-300/95 sm:col-span-2">{t("me_kycReservedNote")}</p> : null}
                  <div className="space-y-0.5 pt-1">
                    <p className="text-meta text-slate-200">{t("me_id")}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-meta text-slate-300 font-mono break-all min-w-0">{user.id}</p>
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
                  <div className="space-y-0.5 pt-1">
                    <p className="text-meta text-slate-200">{t("me_wallet")}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-meta text-slate-300">
                      {user.default_wallet_address?.trim() ? (
                        <>
                          <span className="font-mono break-all min-w-0">
                            {user.default_wallet_address.slice(0, 10)}…{user.default_wallet_address.slice(-8)}
                          </span>
                          <CopyButton
                            text={user.default_wallet_address}
                            field="wallet"
                            copiedField={copiedField}
                            copyClipboardBusy={copyClipboardBusy}
                            onCopy={copyToClipboard}
                            t={t}
                            className="shrink-0"
                          />
                        </>
                      ) : (
                        <span>{t("me_notSet")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                  {copiedField ? t("me_copiedAnnounce") : ""}
                </p>
                <div className={`${insetInCollapsible ? "mt-3" : "mt-4"} flex flex-wrap items-center gap-x-4 gap-y-2`}>
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      setEditing(true);
                    }}
                  >
                    <button
                      ref={editButtonRef as React.RefObject<HTMLButtonElement> | undefined}
                      type="submit"
                      className={editProfileBtnClass}
                    >
                      {t("me_editProfile")}
                    </button>
                  </form>
                  {connectedAddress ? (
                    <form
                      className="inline"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        void handleSyncWallet();
                      }}
                    >
                      <button
                        type="submit"
                        disabled={syncingWallet}
                        aria-busy={syncingWallet ? true : undefined}
                        className={
                          settingsL5Layout
                            ? `${TT_AUTH_L5_FORM.secondaryButton} min-h-[44px] px-4`
                            : `inline-flex items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub disabled:opacity-50 ${FOCUS_RING}`
                        }
                      >
                        {syncingWallet ? t("me_syncing") : t("me_useConnectedWallet")}
                      </button>
                    </form>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-4 sm:gap-6">
                  {showAvatar ? (
                    <Image
                      src={user.avatar_url!}
                      alt={user.nickname ?? ""}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-fuchsia-400/30 shrink-0"
                      unoptimized
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-h3 font-semibold text-fuchsia-300 ring-2 ring-fuchsia-400/30 shrink-0"
                      role="img"
                      aria-label={user.nickname ?? ""}
                    >
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-body font-medium text-slate-200">{user.nickname?.trim() || t("me_notSet")}</p>
                      <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-2.5 py-0.5 text-meta text-cyan-300">
                        {roleLabel}
                      </span>
                    </div>
                    <p className="text-small text-slate-300">{user.email ?? t("ui_em_dash")}</p>
                    <p className="text-meta text-slate-300">{t("me_joinedAt")}: {formatJoinedAt(user.created_at, t("ui_em_dash"))}</p>
                    <p className="text-meta text-slate-300">
                      {t("me_kycStatus")}{" "}
                      <span className="text-slate-100 font-mono" translate="no">
                        {kycRaw}
                      </span>
                    </p>
                    <p className="text-meta text-slate-300/95">{t("me_kycReservedNote")}</p>
                    <div className="space-y-0.5">
                      <p className="text-meta text-slate-200">{t("me_id")}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-meta text-slate-300 font-mono break-all min-w-0">{user.id}</p>
                        {user.id && (
                          <CopyButton text={user.id} field="id" copiedField={copiedField} copyClipboardBusy={copyClipboardBusy} onCopy={copyToClipboard} t={t} />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-meta text-slate-300">
                      <p>
                        <span className="text-slate-200">{t("me_avatar")}:</span>{" "}
                        {user.avatar_url?.trim() ? t("me_avatarSet") : t("me_notSet")}
                      </p>
                      <p>
                        <span className="text-slate-200">{t("me_wallet")}:</span>{" "}
                        {user.default_wallet_address?.trim() ? (
                          <>
                            <span className="font-mono">{user.default_wallet_address.slice(0, 10)}…{user.default_wallet_address.slice(-8)}</span>
                            <CopyButton text={user.default_wallet_address} field="wallet" copiedField={copiedField} copyClipboardBusy={copyClipboardBusy} onCopy={copyToClipboard} t={t} className="ml-1.5 inline-block align-middle" />
                          </>
                        ) : (
                          t("me_notSet")
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {copiedField ? t("me_copiedAnnounce") : ""}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form
                    className="inline"
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      setEditing(true);
                    }}
                  >
                    <button
                      ref={editButtonRef as React.RefObject<HTMLButtonElement> | undefined}
                      type="submit"
                      className={`inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${FOCUS_RING}`}
                    >
                      {t("me_editProfile")}
                    </button>
                  </form>
                  {connectedAddress && (
                    <form
                      className="inline"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        void handleSyncWallet();
                      }}
                    >
                      <button
                        type="submit"
                        disabled={syncingWallet}
                        aria-busy={syncingWallet ? true : undefined}
                        className={`inline-flex items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        {syncingWallet ? t("me_syncing") : t("me_useConnectedWallet")}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <form id={profileEditFormId} onSubmit={handleSubmit} hidden aria-hidden="true" />
            <div className="space-y-4">
              <div>
                <label className="block text-meta text-slate-300 mb-1" htmlFor={editNicknameInputId}>
                  {t("me_nickname")}
                </label>
                <input
                  id={editNicknameInputId}
                  form={profileEditFormId}
                  type="text"
                  autoComplete="nickname"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
                  className={editFieldInputClass}
                  placeholder={t("me_notSet")}
                  aria-describedby={submitError ? editErrorId : undefined}
                />
              </div>
              <p
                id={editAvatarInputId}
                className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-meta text-slate-400 ${compactCommunityLayout ? "border-ref-sun/22 bg-ink-800/40" : "border-slate-600/60 bg-slate-800/40"}`}
                role="note"
              >
                {t("community_me_avatar_upload_hint")}
              </p>
              <div>
                <label className="block text-meta text-slate-300 mb-1" htmlFor={editWalletInputId}>
                  {t("me_wallet")}
                </label>
                <div className="flex gap-2">
                  <input
                    id={editWalletInputId}
                    form={profileEditFormId}
                    type="text"
                    autoComplete="off"
                    value={editForm.default_wallet_address}
                    onChange={(e) => setEditForm((f) => ({ ...f, default_wallet_address: e.target.value }))}
                    className={editWalletInputClass}
                    placeholder={t("auth_register_placeholder_wallet")}
                  />
                  {connectedAddress && (
                    <form
                      className="inline shrink-0"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        setEditForm((f) => ({ ...f, default_wallet_address: connectedAddress }));
                      }}
                    >
                      <button
                        type="submit"
                        className={editWalletSyncBtnClass}
                      >
                        {t("me_useConnectedWallet")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
              {submitError && (
                <p id={editErrorId} className="text-small text-warning" role="alert">{submitError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  form={profileEditFormId}
                  disabled={submitting}
                  aria-busy={submitting ? true : undefined}
                  className={editSaveBtnClass}
                >
                  {submitting ? t("me_syncing") : t("me_save")}
                </button>
                <form
                  className="inline"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    setEditing(false);
                  }}
                >
                  <button
                    type="submit"
                    className={editCancelBtnClass}
                  >
                    {t("me_cancel")}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </RootTag>
  );
}
