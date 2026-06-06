"use client";

import Link from "next/link";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";

export type MeIdentitiesL5IdentityCardProps = {
  href: string;
  title: string;
  description: string;
  ctaLabel: string;
  surfaceId: string;
  className?: string;
  statusLabel?: string | null;
  statusState?: MeIdentitySlotState | null;
  /** 核心轨细粒度阶段（机读 · ① Hub P1） */
  corePhase?: string | null;
};

function statusPillClass(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return TT_ME_IDENTITIES_L5.cardStatusPillActive;
    case "pending":
      return TT_ME_IDENTITIES_L5.cardStatusPillPending;
    case "restricted":
      return TT_ME_IDENTITIES_L5.cardStatusPillRestricted;
    default:
      return TT_ME_IDENTITIES_L5.cardStatusPillPending;
  }
}

/** `/me/identities` 申请卡片：与 `AuthL5Card` 同族玻璃层次（ambient · sheen · floor）。 */
export function MeIdentitiesL5IdentityCard({
  href,
  title,
  description,
  ctaLabel,
  surfaceId,
  className = "",
  statusLabel = null,
  statusState = null,
  corePhase = null,
}: MeIdentitiesL5IdentityCardProps) {
  return (
    <Link
      href={href}
      className={`${TT_ME_IDENTITIES_L5.identityCard} ${className}`.trim()}
      data-tt-me-identities-card={surfaceId}
      {...(corePhase ? { "data-tt-me-identities-core-phase": corePhase } : {})}
      aria-label={`${title} — ${ctaLabel}`}
    >
      <span className={TT_ME_IDENTITIES_L5.cardAmbient} aria-hidden />
      <span className={TT_ME_IDENTITIES_L5.cardSheen} aria-hidden />
      <span className={TT_ME_IDENTITIES_L5.cardInnerGlow} aria-hidden />
      <span className={TT_ME_IDENTITIES_L5.cardFloor} aria-hidden />
      <span className={TT_ME_IDENTITIES_L5.cardBody}>
        {statusLabel && statusState ? (
          <span className={TT_ME_IDENTITIES_L5.cardStatusRow}>
            <span className={statusPillClass(statusState)}>{statusLabel}</span>
          </span>
        ) : null}
        <span className={TT_ME_IDENTITIES_L5.cardTitle}>{title}</span>
        <span className={TT_ME_IDENTITIES_L5.cardDesc}>{description}</span>
        <span className={TT_ME_IDENTITIES_L5.cardCta}>
          {ctaLabel}
          <span className={TT_ME_IDENTITIES_L5.cardCtaIcon} aria-hidden>
            →
          </span>
        </span>
      </span>
    </Link>
  );
}
