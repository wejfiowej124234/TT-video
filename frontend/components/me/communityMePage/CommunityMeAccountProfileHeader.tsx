"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent, type ChangeEvent, type RefObject } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import type { UserShape } from "@/components/me/constants";
import {
  communityCardLinkFocus,
  communityWarningPillFocus,
} from "@/lib/communityA11yFocus";
import { communityRoleLabelI18nKey, meProtocolRoleForDisplay } from "@/lib/meRoleDisplay";
import { communityMediaNextImageUnoptimized } from "@/lib/communityMediaClientUrl";
import { TT_COMMUNITY_ME_PANEL_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import type { CommunityMeAccountPanelTFunc } from "@/components/me/communityMePage/communityMeAccountPanelUtils";

export default function CommunityMeAccountProfileHeader({
  t,
  compactVertical,
  user,
  displayName,
  headerInitial,
  headerAvatarResolved,
  walletPreview,
  bioCardText,
  bioFeatureOn,
  avatarFileRef,
  onAvatarPickClick,
  onAvatarFileChange,
  avatarUploadBusy,
  avatarLocalUploadEnabled,
  avatarUploadErr,
}: {
  t: CommunityMeAccountPanelTFunc;
  compactVertical: boolean;
  user: UserShape;
  displayName: string;
  headerInitial: string;
  headerAvatarResolved: string;
  walletPreview: string;
  bioCardText: string;
  bioFeatureOn: boolean;
  avatarFileRef: RefObject<HTMLInputElement | null>;
  onAvatarPickClick: (e: FormEvent) => void;
  onAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  avatarUploadBusy: boolean;
  avatarLocalUploadEnabled: boolean;
  avatarUploadErr: string | null;
}) {
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);
  const showAvatarImage = Boolean(headerAvatarResolved) && !avatarImgFailed;

  useEffect(() => {
    setAvatarImgFailed(false);
  }, [headerAvatarResolved]);

  return (
    <>
      <div className={`flex items-start ${compactVertical ? "gap-3" : "gap-4"}`}>
        <div className="relative flex-shrink-0">
          <div
            className={`relative rounded-full overflow-hidden ${TT_COMMUNITY_PAGE_L5.avatarRing} bg-ink-800 flex items-center justify-center ${
              compactVertical ? "h-16 w-16" : "h-20 w-20"
            }`}
          >
            {showAvatarImage ? (
              <Image
                src={headerAvatarResolved}
                alt=""
                fill
                className="object-cover"
                sizes={compactVertical ? "64px" : "80px"}
                unoptimized={communityMediaNextImageUnoptimized(headerAvatarResolved)}
                onError={() => setAvatarImgFailed(true)}
              />
            ) : (
              <span className={TT_COMMUNITY_ME_PANEL_L5.avatarInitial} aria-hidden>
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
          <form className="absolute -bottom-0.5 -right-0.5" onSubmit={onAvatarPickClick}>
            <button
              type="submit"
              disabled={avatarUploadBusy}
              aria-busy={avatarUploadBusy ? true : undefined}
              className={`h-11 w-11 shrink-0 rounded-full border-2 border-slate-900 bg-warning flex items-center justify-center text-white hover:bg-warning/85 motion-sub disabled:opacity-60 ${communityWarningPillFocus}`}
              aria-label={
                avatarLocalUploadEnabled ? t("community_me_change_avatar") : t("community_me_edit_profile")
              }
              title={
                avatarLocalUploadEnabled ? t("community_me_upload_avatar") : t("community_me_edit_profile")
              }
            >
              <span className="text-body-l font-bold leading-none">+</span>
            </button>
          </form>
          {avatarLocalUploadEnabled ? (
            <p className={TT_COMMUNITY_ME_PANEL_L5.avatarUploadHint}>
              {t("community_me_upload_avatar")}
            </p>
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={`font-bold text-slate-100 ${compactVertical ? "text-body-l sm:text-h4" : "text-h4"}`}>{displayName}</h1>
          <p className={TT_COMMUNITY_ME_PANEL_L5.roleLabel}>
            {t(communityRoleLabelI18nKey(meProtocolRoleForDisplay(user)))}
          </p>
          <p className="text-meta text-slate-300 mt-0.5 break-all">
            {t("community_did_wallet_label")}
            {t("community_did_colon")}
            <span className="text-slate-100/95 font-mono text-[0.8125rem]">{walletPreview}</span>
          </p>
          <div className={compactVertical ? "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" : "mt-2"}>
            {bioFeatureOn ? (
              bioCardText ? (
                compactVertical ? (
                  <span className="text-[0.7rem] text-slate-300/95 line-clamp-3 sm:line-clamp-4 whitespace-pre-wrap break-words max-w-full">
                    {bioCardText}
                  </span>
                ) : (
                  <p className="text-small text-slate-300 whitespace-pre-wrap break-words w-full">{bioCardText}</p>
                )
              ) : (
                <>
                  {compactVertical ? (
                    <span className="text-[0.65rem] text-slate-500 truncate max-w-[10rem] sm:max-w-[14rem]">
                      {t("community_me_bio_empty")}
                    </span>
                  ) : (
                    <p className="text-small text-slate-300">{t("community_me_bio_empty")}</p>
                  )}
                  <form className="inline" onSubmit={(e: FormEvent) => e.preventDefault()}>
                    <button
                      type="submit"
                      className={`${TT_COMMUNITY_ME_PANEL_L5.linkAccent} ${compactVertical ? "" : "mt-1"} min-h-[44px] inline-flex items-center justify-center ${communityCardLinkFocus}`}
                      aria-label={t("community_me_add_bio")}
                    >
                      {t("community_me_add_bio")}
                    </button>
                  </form>
                </>
              )
            ) : (
              <>
                {compactVertical ? (
                  <span className="text-[0.65rem] text-slate-500 truncate max-w-[10rem] sm:max-w-[14rem]">
                    {t("community_me_bio_empty")}
                  </span>
                ) : (
                  <p className="text-small text-slate-300">{t("community_me_bio_empty")}</p>
                )}
                <form className="inline" onSubmit={(e: FormEvent) => e.preventDefault()}>
                  <button
                    type="submit"
                    className={`${TT_COMMUNITY_ME_PANEL_L5.linkAccent} ${compactVertical ? "" : "mt-1"} min-h-[44px] inline-flex items-center justify-center ${communityCardLinkFocus}`}
                    aria-label={t("community_me_add_bio")}
                  >
                    {t("community_me_add_bio")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      {avatarUploadErr ? (
        <div className="mt-3" role="alert">
          <ApiErrorAlert message={avatarUploadErr} tone="dark" />
        </div>
      ) : null}
    </>
  );
}
