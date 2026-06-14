"use client";

import type { MeIdentitiesProfileLinkId } from "@/lib/me/meIdentitiesProfileLinksModel";
import { meIdentitiesProfileLinkFallbackImage } from "@/lib/me/meIdentitiesProfileLinkVisuals";
import { TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";

type Props = {
  linkId: MeIdentitiesProfileLinkId;
  src?: string;
};

/** Hub「身份资料」左侧 L5 媒体栏（通高 cover · 非小圆角 icon）。 */
export function MeIdentitiesProfileLinkThumb({ linkId, src }: Props) {
  const imageSrc = src?.trim() || meIdentitiesProfileLinkFallbackImage(linkId);

  return (
    <span
      className={TT_ME_IDENTITIES_L5.profileLinkMediaCol}
      data-tt-me-identities-profile-link-media={linkId}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="" className={TT_ME_IDENTITIES_L5.profileLinkMediaImg} loading="lazy" decoding="async" />
      <span className={TT_ME_IDENTITIES_L5.profileLinkMediaScrim} />
      <span className={TT_ME_IDENTITIES_L5.profileLinkMediaRing} />
    </span>
  );
}
