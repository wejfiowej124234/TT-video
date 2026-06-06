"use client";

import type { FormEvent } from "react";
import CopyButton from "./CopyButton";
import { FOCUS_RING, formatJoinedAt } from "./constants";
import type { UserShape } from "./constants";

export interface MeProfileSectionReadCompactProps {
  t: (k: string) => string;
  user: UserShape;
  kycRaw: string;
  bioRead: string;
  copiedField: "id" | "wallet" | null;
  copyClipboardBusy: "id" | "wallet" | null;
  copyToClipboard: (text: string, field: "id" | "wallet") => void;
  connectedAddress: string | undefined;
  syncingWallet: boolean;
  editButtonRef: React.RefObject<HTMLButtonElement | null>;
  setEditing: (v: boolean) => void;
  handleSyncWallet: () => void;
  unifiedInCommunityCard: boolean;
  insetInCollapsible: boolean;
}

export default function MeProfileSectionReadCompact({
  t,
  user,
  kycRaw,
  bioRead,
  copiedField,
  copyClipboardBusy,
  copyToClipboard,
  connectedAddress,
  syncingWallet,
  editButtonRef,
  setEditing,
  handleSyncWallet,
  unifiedInCommunityCard,
  insetInCollapsible,
}: MeProfileSectionReadCompactProps) {
  return (
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
        {bioRead ? (
          <div className="space-y-0.5 pt-1 sm:col-span-2">
            <p className="text-meta text-slate-200">{t("me_bio")}</p>
            <p className="text-small text-slate-300/95 whitespace-pre-wrap break-words">{bioRead}</p>
          </div>
        ) : null}
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
            className={`text-meta font-medium text-cyan-300 hover:text-cyan-100 underline underline-offset-2 min-h-[44px] inline-flex items-center motion-sub ${FOCUS_RING}`}
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
              className={`inline-flex items-center justify-center rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2.5 min-h-[44px] text-meta font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub disabled:opacity-50 ${FOCUS_RING}`}
            >
              {syncingWallet ? t("me_syncing") : t("me_useConnectedWallet")}
            </button>
          </form>
        ) : null}
      </div>
    </>
  );
}
