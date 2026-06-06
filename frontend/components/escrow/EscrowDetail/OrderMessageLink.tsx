"use client";

import Link from "next/link";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  escrowProtocolHeadingClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT,
} from "@/lib/escrowProtocolUi";
import { escrowExperienceLinkClass, TT_ESCROW_EXPERIENCE_PANEL } from "@/lib/escrowExperienceUi";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 53-S7：订单消息入口 — 与 TT 社区/订单聊天关联（04 `GET`/`POST /api/v1/orders/:id/messages`）
 * 草稿协议区可用 `compact` 内联一行；非草稿在步骤 2～4 用完整卡片。跳转 `/community/messages?orderId=`（53-S7）
 */
export interface OrderMessageLinkProps {
  orderId: string;
  /** 53-S4：协议区使用暖色 L5 面板样式 */
  variantDid?: boolean;
  /** Draft pre-escrow Experience 暖色壳 */
  variantExperience?: boolean;
  /** 草稿协议区内联一行，避免与底部完整卡片重复堆叠 */
  compact?: boolean;
}

export default function OrderMessageLink({
  orderId,
  variantDid,
  variantExperience = false,
  compact,
}: OrderMessageLinkProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const panelClass = isExperience
    ? `${TT_ESCROW_EXPERIENCE_PANEL} p-4`
    : isDid
      ? TT_ESCROW_PROTOCOL_PANEL_PADDED_COMPACT
      : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console/60 p-4";
  const href = `/community/messages?orderId=${encodeURIComponent(orderId)}`;
  const protocolLinkClass = `${touchTargetLink44Classes} ${escrowProtocolInlineLinkClass}`;

  if (compact) {
    const linkClass = isExperience
      ? `${touchTargetLink44Classes} ${escrowExperienceLinkClass}`
      : isDid
        ? protocolLinkClass
        : `${touchTargetLink44Classes} font-medium text-travel-600 hover:text-travel-700 underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`;
    return (
      <p className={`text-meta ${isExperience ? "text-white/75" : isDid ? escrowProtocolMetaClass : "text-ink-600"}`}>
        <Link
          href={href}
          className={linkClass}
          aria-label={`${isExperience ? t("order_messageLinkCta_experience") : t("order_messageLinkCta")} — ${t("order_messageLinkCompactTail")}`}
        >
          {isExperience ? t("order_messageLinkCta_experience") : t("order_messageLinkCta")}
        </Link>
        <span className="mx-1.5 opacity-60" aria-hidden>
          ·
        </span>
        <span>{t("order_messageLinkCompactTail")}</span>
      </p>
    );
  }

  return (
    <section className={panelClass} aria-labelledby={headingId} data-tt-escrow-order-message-link="1">
      <h3
        id={headingId}
        className={`mb-2 ${isExperience ? "text-small font-medium text-ref-sun/95" : isDid ? escrowProtocolHeadingClass : "text-small font-medium text-ink-800"}`}
      >
        {t("order_messageLinkTitle")}
      </h3>
      <p
        className={`text-small mb-3 leading-relaxed ${isExperience ? "text-white/75" : isDid ? escrowProtocolMetaClass : "text-ink-600"}`}
      >
        {t("order_messageLinkDesc")}
      </p>
      <Link
        href={href}
        className={
          isExperience
            ? `${touchTargetLink44Classes} inline-flex items-center gap-2 text-small font-medium ${escrowExperienceLinkClass}`
            : isDid
              ? `${touchTargetLink44Classes} inline-flex items-center gap-2 ${escrowProtocolInlineLinkClass}`
              : `${touchTargetLink44Classes} gap-2 text-small font-medium text-travel-600 hover:text-travel-700 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console rounded-[var(--radius-sm)]`
        }
        aria-label={t("order_messageLinkCta")}
      >
        {t("order_messageLinkCta")}
      </Link>
      <p className={`text-meta mt-2 ${isDid ? escrowProtocolMetaClass : "text-ink-500"}`} role="note">
        {t("order_chatDisputeHint")}
      </p>
      <p className={`text-meta mt-1 ${isDid ? escrowProtocolMetaClass : "text-ink-500"}`} role="note">
        {t("community_conductHint")}
      </p>
    </section>
  );
}
