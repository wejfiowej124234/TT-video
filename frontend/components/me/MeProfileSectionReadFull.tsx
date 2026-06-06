"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import CopyButton from "./CopyButton";
import { FOCUS_RING, formatJoinedAt } from "./constants";
import type { UserShape } from "./constants";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";

export interface MeProfileSectionReadFullProps {
  t: (k: string) => string;
  user: UserShape;
  avatarSrcResolved: string;
  showAvatar: boolean;
  initial: string;
  roleLabel: string;
  kycRaw: string;
  bioRead: string;
  setAvatarError: (v: boolean) => void;
  copiedField: "id" | "wallet" | null;
  copyClipboardBusy: "id" | "wallet" | null;
  copyToClipboard: (text: string, field: "id" | "wallet") => void;
  connectedAddress: string | undefined;
  syncingWallet: boolean;
  editButtonRef: React.RefObject<HTMLButtonElement | null>;
  setEditing: (v: boolean) => void;
  handleSyncWallet: () => void;
}

export default function MeProfileSectionReadFull({
  t,
  user,
  avatarSrcResolved,
  showAvatar,
  initial,
  roleLabel,
  kycRaw,
  bioRead,
  setAvatarError,
  copiedField,
  copyClipboardBusy,
  copyToClipboard,
  connectedAddress,
  syncingWallet,
  editButtonRef,
  setEditing,
  handleSyncWallet,
}: MeProfileSectionReadFullProps) {
  return (
    <>
      <div className="flex flex-wrap items-start gap-4 sm:gap-6">
        {showAvatar ? (
          <Image
            src={avatarSrcResolved}
            alt={user.nickname ?? ""}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-fuchsia-400/30 shrink-0"
            unoptimized={communityMediaNextImageUnoptimized(avatarSrcResolved)}
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
            <span className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-2.5 py-0.5 text-meta text-cyan-300">{roleLabel}</span>
          </div>
          <p className="text-small text-slate-300">{user.email ?? t("ui_em_dash")}</p>
          <p className="text-meta text-slate-300">
            {t("me_joinedAt")}: {formatJoinedAt(user.created_at, t("ui_em_dash"))}
          </p>
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
                  <span className="font-mono">
                    {user.default_wallet_address.slice(0, 10)}…{user.default_wallet_address.slice(-8)}
                  </span>
                  <CopyButton
                    text={user.default_wallet_address}
                    field="wallet"
                    copiedField={copiedField}
                    copyClipboardBusy={copyClipboardBusy}
                    onCopy={copyToClipboard}
                    t={t}
                    className="ml-1.5 inline-block align-middle"
                  />
                </>
              ) : (
                t("me_notSet")
              )}
            </p>
          </div>
          {bioRead ? (
            <div className="mt-2 space-y-1">
              <p className="text-meta text-slate-200">{t("me_bio")}</p>
              <p className="text-small text-slate-300 whitespace-pre-wrap break-words">{bioRead}</p>
            </div>
          ) : null}
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
  );
}
