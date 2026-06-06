"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MeSettingsL5Icon } from "@/components/me/MeSettingsL5Icon";
import { ME_SETTINGS_PROFILE_PATH, TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import { formatWalletOrDidShort } from "@/lib/formatWalletOrDidShort";
import type { UserShape } from "@/components/me/constants";

function roleLabelKey(role: string | undefined): string {
  switch (role) {
    case "guide":
      return "header_identitySpine_guide";
    case "provider":
    case "merchant":
      return "header_identitySpine_merchant";
    default:
      return "header_identitySpine_traveler";
  }
}

export function MeSettingsProfileCard({
  user,
  t,
}: {
  user: UserShape;
  t: (key: string) => string;
}) {
  const [avatarBroken, setAvatarBroken] = useState(false);
  const rawDisplay =
    (user.nickname?.trim() && user.nickname.trim()) || user.id?.slice(0, 8) || t("me_defaultDisplayName");
  const displayName = /^https?:\/\//i.test(rawDisplay) ? t("me_defaultDisplayName") : rawDisplay;
  const initial = (displayName.trim().charAt(0) || "?").toUpperCase();
  const avatarUrl = user.avatar_url?.trim() ?? "";
  const avatarResolved = avatarUrl ? communityMediaAbsoluteUrlForRender(avatarUrl) : "";
  const walletShort = formatWalletOrDidShort(user.default_wallet_address ?? undefined);
  const email = user.email?.trim() ?? "";

  return (
    <Link
      href={ME_SETTINGS_PROFILE_PATH}
      className={TT_ME_SETTINGS_L5.profileCard}
      aria-label={t("me_settings_profile_edit")}
      data-tt-me-settings-profile-card="1"
    >
      <span className={TT_ME_SETTINGS_L5.profileAvatar} aria-hidden>
        {avatarResolved && !avatarBroken ? (
          <Image
            src={avatarResolved}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized={communityMediaNextImageUnoptimized(avatarResolved)}
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <span className="text-h4 font-semibold text-ref-sun/90">{initial}</span>
        )}
      </span>
      <span className={TT_ME_SETTINGS_L5.profileBody}>
        <span className={TT_ME_SETTINGS_L5.profileName}>{displayName}</span>
        <span className={TT_ME_SETTINGS_L5.profileMeta}>
          {email ? email : walletShort ? walletShort : user.id?.slice(0, 8)}
        </span>
        <span className={TT_ME_SETTINGS_L5.profileRole}>{t(roleLabelKey(user.role))}</span>
      </span>
      <span className={TT_ME_SETTINGS_L5.profileChevron} aria-hidden>
        <MeSettingsL5Icon id="chevron" />
      </span>
    </Link>
  );
}

export function MeSettingsProfileCardSkeleton() {
  return (
    <div className={`${TT_ME_SETTINGS_L5.profileCard} pointer-events-none`} aria-hidden>
      <span className={`${TT_ME_SETTINGS_L5.profileAvatar} animate-pulse bg-ref-sun/10`} />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-4 w-32 rounded bg-ref-sun/15 animate-pulse" />
        <span className="h-3 w-48 rounded bg-slate-700/60 animate-pulse" />
        <span className="h-3 w-16 rounded bg-ref-sun/10 animate-pulse" />
      </span>
    </div>
  );
}
