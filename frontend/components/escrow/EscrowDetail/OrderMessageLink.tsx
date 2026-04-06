"use client";

import Link from "next/link";
import {
  marketCyanInlineLinkFocusClasses,
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { useId } from "react";
import { useTranslation } from "@/components/LocaleProvider";

/**
 * 53-S7：订单消息入口 — 与 TT 社区/订单聊天关联（04 `GET`/`POST /api/v1/orders/:id/messages`）
 * 草稿协议区可用 `compact` 内联一行；非草稿在步骤 2～4 用完整卡片。跳转 `/community/messages?orderId=`（53-S7）
 */
export interface OrderMessageLinkProps {
  orderId: string;
  /** 53-S4：协议区使用 30-DID 面板样式 */
  variantDid?: boolean;
  /** 草稿协议区内联一行，避免与底部完整卡片重复堆叠 */
  compact?: boolean;
}

export default function OrderMessageLink({ orderId, variantDid, compact }: OrderMessageLinkProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const panelClass = variantDid
    ? "rounded-[var(--radius-md)] border border-cyan-500/30 bg-slate-900/70 backdrop-blur-md p-4"
    : "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console/60 p-4";
  const href = `/community/messages?orderId=${encodeURIComponent(orderId)}`;

  if (compact) {
    const linkClass = variantDid
      ? `${touchTargetLink44Classes} font-medium text-cyan-300 hover:text-cyan-100 underline-offset-2 hover:underline ${marketCyanInlineLinkFocusClasses}`
      : `${touchTargetLink44Classes} font-medium text-travel-600 hover:text-travel-700 underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`;
    return (
      <p className={`text-meta ${variantDid ? "text-slate-300" : "text-ink-600"}`}>
        <Link
          href={href}
          className={linkClass}
          aria-label={`${t("order_messageLinkCta")} — ${t("order_messageLinkDesc")}`}
        >
          {t("order_messageLinkCta")}
        </Link>
        <span className="mx-1.5 opacity-60" aria-hidden>
          ·
        </span>
        <span>{t("order_messageLinkCompactTail")}</span>
      </p>
    );
  }

  return (
    <section className={panelClass} aria-labelledby={headingId}>
      <h3 id={headingId} className="text-small font-medium text-cyan-200 mb-2">
        {t("order_messageLinkTitle")}
      </h3>
      <p className={`text-small mb-3 leading-relaxed ${variantDid ? "text-slate-300" : "text-ink-600"}`}>{t("order_messageLinkDesc")}</p>
      <Link
        href={href}
        className={`${
          variantDid
            ? `${touchTargetLink44Classes} inline-flex items-center gap-2 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors ${marketCyanInlineLinkFocusClasses}`
            : `${touchTargetLink44Classes} gap-2 text-small font-medium text-cyan-300 hover:text-cyan-100 hover:drop-shadow-scifi-cyan-lg transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console rounded-[var(--radius-sm)]`
        }`}
        aria-label={t("order_messageLinkCta")}
      >
        {t("order_messageLinkCta")}
      </Link>
      <p className={`text-meta mt-2 ${variantDid ? "text-slate-300" : "text-ink-500"}`} role="note">
        {t("order_chatDisputeHint")}
      </p>
      <p className={`text-meta mt-1 ${variantDid ? "text-slate-300" : "text-ink-500"}`} role="note">
        {t("community_conductHint")}
      </p>
    </section>
  );
}
